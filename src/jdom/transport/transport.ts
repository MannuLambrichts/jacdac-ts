import { JDBus } from "../bus"
import {
    CHANGE,
    CONNECT,
    CONNECTING,
    CONNECTION_STATE,
    DISCONNECT,
    DISCONNECTING,
    ERROR,
    LOST,
    FRAME_SEND_DISCONNECT,
    SELF_ANNOUNCE,
    TRANSPORT_CONNECT_RETRY_DELAY,
    TRANSPORT_PULSE_TIMEOUT,
} from "../constants"
import { isCancelError } from "../error"
import { JDEventSource } from "../eventsource"
import { Flags } from "../flags"
import { Observable } from "../observable"
import { assert, delay } from "../utils"

/**
 * Connection states for transports
 * @category Transport
 */
export enum ConnectionState {
    Connected = "connected",
    Connecting = "connecting",
    Disconnecting = "disconnecting",
    Disconnected = "disconnected",
}

/**
 * General options for the transports
 * @category Transport
 */
export interface TransportOptions {
    // if no packets is received within the pulse interval, disconnect/reconnect
    checkPulse?: boolean
    connectObservable?: Observable<void>
    disconnectObservable?: Observable<void>
}

/**
 * A transport marshalls Jacdac packets between a physical device on the TypeScript bus.
 * @category Transport
 */
export abstract class Transport extends JDEventSource {
    private _bus: JDBus
    private _checkPulse: boolean
    private _connectionTime: number
    private _lastReceivedTime: number
    protected disposed = false
    private _cleanups: (() => void)[]

    constructor(readonly type: string, options?: TransportOptions) {
        super()
        this.checkPulse = this.checkPulse.bind(this)
        this._checkPulse = !!options?.checkPulse
        this._cleanups = [
            options?.connectObservable?.subscribe({
                next: async () => {
                    if (Flags.diagnostics)
                        console.debug(
                            `${this.type}: device detected, connect ${
                                this.bus?.autoConnect ? "auto" : "manual"
                            }`
                        )
                    if (this.bus?.disconnected && this.bus?.autoConnect) {
                        await delay(TRANSPORT_CONNECT_RETRY_DELAY)
                        if (this.bus?.disconnected && this.bus?.autoConnect) {
                            if (
                                typeof document === "undefined" || // Node.js
                                document.visibilityState === "visible" // or tab visible
                            ) {
                                this.connect(true)
                            }
                        }
                    }
                },
            })?.unsubscribe,
            options?.disconnectObservable?.subscribe({
                next: () => {
                    this.disconnect()
                },
            })?.unsubscribe,
        ].filter(c => !!c)
    }

    get bus() {
        return this._bus
    }

    set bus(bus: JDBus) {
        assert(!this._bus && !!bus)
        this._bus = bus
        if (this._bus) this.disconnect() // async
        if (this._bus && this._checkPulse)
            this._bus.on(SELF_ANNOUNCE, this.checkPulse)
        else this._bus.off(SELF_ANNOUNCE, this.checkPulse)
    }

    private _connectionState = ConnectionState.Disconnected
    private _connectPromise: Promise<void>
    private _disconnectPromise: Promise<void>

    /**
     * Gets the bus connection state.
     */
    get connectionState(): ConnectionState {
        return this._connectionState
    }

    private setConnectionState(state: ConnectionState) {
        if (this._connectionState !== state) {
            //console.debug(`${this._connectionState} -> ${state}`)
            this._connectionState = state
            this._connectionTime =
                state === ConnectionState.Connected
                    ? this.bus.timestamp
                    : undefined
            this._lastReceivedTime = undefined
            this.emit(CONNECTION_STATE, this._connectionState)
            this.bus.emit(CONNECTION_STATE, this)
            switch (this._connectionState) {
                case ConnectionState.Connected:
                    this.emit(CONNECT)
                    break
                case ConnectionState.Connecting:
                    this.emit(CONNECTING)
                    break
                case ConnectionState.Disconnecting:
                    this.emit(DISCONNECTING)
                    break
                case ConnectionState.Disconnected:
                    this.emit(DISCONNECT)
                    break
            }
            this.emit(CHANGE)
            this.bus.emit(CHANGE)
        }
    }

    get connecting() {
        return this.connectionState == ConnectionState.Connecting
    }

    get disconnecting() {
        return this.connectionState == ConnectionState.Disconnecting
    }

    get connected() {
        return this._connectionState == ConnectionState.Connected
    }

    get disconnected() {
        return this._connectionState == ConnectionState.Disconnected
    }

    protected abstract transportSendPacketAsync(pkt: Uint8Array): Promise<void>
    protected abstract transportConnectAsync(
        background?: boolean
    ): Promise<void>
    protected abstract transportDisconnectAsync(
        background?: boolean
    ): Promise<void>

    private async checkPulse() {
        assert(this._checkPulse)
        if (!this.connected) return // ignore while connected
        if (this.bus.safeBoot) return // don't mess with flashing bootloaders
        const devices = this.bus.devices()
        if (devices.some(dev => dev.firmwareUpdater))
            // don't mess with flashing
            return

        // detect if the proxy device is lost
        const t =
            this.bus.timestamp -
            (this._lastReceivedTime || this._connectionTime)
        if (t > TRANSPORT_PULSE_TIMEOUT) {
            this.emit(LOST)
            if (Flags.diagnostics)
                console.debug(`${this.type}: lost connection with device`)
            if (this._lastReceivedTime !== undefined) await this.reconnect()
            else await this.disconnect(true)
        }
    }

    async sendPacketWhenConnectedAsync(frame: Uint8Array) {
        if (this.connected) await this.transportSendPacketAsync(frame)
        else this.emit(FRAME_SEND_DISCONNECT, frame)
    }

    connect(background?: boolean): Promise<void> {
        if (Flags.diagnostics)
            console.debug(
                `${this.type}: connect ${background ? `(background)` : ""}`
            )
        if (this.disposed)
            throw new Error("attempted to connect to a disposed transport")
        // already connected
        if (this.connectionState == ConnectionState.Connected) {
            if (Flags.diagnostics)
                console.debug(`${this.type}: already connected`)
            return Promise.resolve()
        }

        // connecting
        if (!this._connectPromise) {
            // already disconnecting, retry when disconnected
            if (this._disconnectPromise) {
                if (Flags.diagnostics)
                    console.debug(
                        `${this.type}: queuing connect after disconnecting`
                    )
                const p = this._disconnectPromise
                this._disconnectPromise = undefined
                this._connectPromise = p.then(() => this.connect())
            } else {
                // starting a fresh connection
                console.debug(`${this.type}: connecting`)
                this._connectPromise = Promise.resolve()
                this.setConnectionState(ConnectionState.Connecting)
                this._connectPromise = this._connectPromise.then(() =>
                    this.transportConnectAsync(background)
                )
                const p = (this._connectPromise = this._connectPromise
                    .then(() => {
                        if (p == this._connectPromise) {
                            this._connectPromise = undefined
                            this.setConnectionState(ConnectionState.Connected)
                        } else {
                            console.debug(
                                `${this.type}: connection aborted in flight`,
                                {
                                    state: this._connectionState,
                                    old: this._connectPromise,
                                    new: p,
                                }
                            )
                            // already reported
                        }
                    })
                    .catch(e => {
                        if (p == this._connectPromise) {
                            this._connectPromise = undefined
                            this.setConnectionState(
                                ConnectionState.Disconnected
                            )
                            if (!background) this.errorHandler(CONNECT, e)
                            else if (Flags.diagnostics)
                                console.debug(
                                    `${this.type}: background connect failed`
                                )
                        } else {
                            if (Flags.diagnostics)
                                console.debug(
                                    `${this.type}: connection error aborted in flight`
                                )
                        }
                    }))
            }
        } else {
            if (Flags.diagnostics)
                console.debug(`${this.type}: connect with existing promise`)
        }
        return this._connectPromise
    }

    disconnect(background?: boolean): Promise<void> {
        // already disconnected
        if (this.connectionState == ConnectionState.Disconnected)
            return Promise.resolve()

        if (!this._disconnectPromise) {
            // connection in progress, wait and disconnect when done
            if (this._connectPromise) {
                if (Flags.diagnostics)
                    console.debug(
                        `${this.type}: cancelling connection and disconnect`
                    )
                this._connectPromise = undefined
            }
            console.debug(`${this.type}: disconnecting`)
            this._disconnectPromise = Promise.resolve()
            this.setConnectionState(ConnectionState.Disconnecting)
            this._disconnectPromise = this._disconnectPromise.then(() =>
                this.transportDisconnectAsync(background)
            )
            this._disconnectPromise = this._disconnectPromise
                .catch(e => {
                    this._disconnectPromise = undefined
                    this.errorHandler(DISCONNECT, e)
                })
                .finally(() => {
                    this._disconnectPromise = undefined
                    this.setConnectionState(ConnectionState.Disconnected)
                })
        } else {
            if (Flags.diagnostics)
                console.debug(`${this.type}: disconnect with existing promise`)
        }
        return this._disconnectPromise
    }

    async reconnect() {
        if (Flags.diagnostics) console.debug(`${this.type}: reconnect`)
        await this.disconnect(true)
        await this.connect(true)
    }

    protected handleFrame(payload: Uint8Array, skipCrc = false) {
        const { timestamp } = this.bus
        this._lastReceivedTime = timestamp
        this.bus.processFrame(payload, this.type, skipCrc)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    protected errorHandler(context: string, exception: any) {
        if (!isCancelError(exception)) {
            this.emit(ERROR, { context, exception })
            this.bus.emit(ERROR, { transport: this.type, context, exception })
        }
        this.emit(CHANGE)

        // when a microbit flash is initiated via file download, the device will
        // stop responding. we should not try to reconnect while this is the case
        this.disconnect(true)
    }

    dispose() {
        this.disposed = true
        this._cleanups.forEach(c => c())
        this._cleanups = []
    }
}

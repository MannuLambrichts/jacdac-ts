import { Packet } from "../packet"
import { Flags } from "../flags"
import { bufferConcat } from "../utils"
import {
    BLUETOOTH_JACDAC_TX_CHARACTERISTIC,
    BLUETOOTH_JACDAC_RX_CHARACTERISTIC,
    BLUETOOTH_JACDAC_SERVICE,
    BLUETOOTH_TRANSPORT,
} from "../constants"
import { Transport } from "./transport"

const JD_BLE_FIRST_CHUNK_FLAG = 0x80

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface WebBluetoothOptions {}

/**
 * Indicates with Web Bluetooth transport are enabled
 * @category Transport
 */
export function isWebBluetoothEnabled(): boolean {
    return !!Flags.webBluetooth
}

/**
 * Indicates with Web Bluetooth is supported in this environment
 * @category Transport
 */
export function isWebBluetoothSupported(): boolean {
    try {
        return (
            typeof navigator !== "undefined" &&
            !!navigator.bluetooth &&
            !!navigator.bluetooth.requestDevice
        )
    } catch (e) {
        return false
    }
}

function bleRequestDevice(
    options?: RequestDeviceOptions
): Promise<BluetoothDevice> {
    // disabled
    if (!Flags.webBluetooth) return Promise.resolve(undefined)

    try {
        console.debug(`bluetooth request`, { options })
        return navigator?.bluetooth?.requestDevice?.(options)
    } catch (e) {
        if (Flags.diagnostics) console.warn(e)
        return undefined
    }
}

function bleGetDevices(): Promise<BluetoothDevice[]> {
    // disabled
    if (!Flags.webBluetooth) return Promise.resolve([])

    try {
        return navigator?.bluetooth?.getDevices() || Promise.resolve([])
    } catch (e) {
        if (Flags.diagnostics) console.warn(e)
        return Promise.resolve([])
    }
}

class BluetoothTransport extends Transport {
    private _device: BluetoothDevice
    private _server: BluetoothRemoteGATTServer
    private _service: BluetoothRemoteGATTService
    private _rxCharacteristic: BluetoothRemoteGATTCharacteristic
    private _txCharacteristic: BluetoothRemoteGATTCharacteristic
    private _rxBuffer: Uint8Array
    private _rxChunkCounter: number

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    constructor(options?: WebBluetoothOptions) {
        super(BLUETOOTH_TRANSPORT, { checkPulse: true })

        this.handleDisconnected = this.handleDisconnected.bind(this)
        this.handleCharacteristicChanged =
            this.handleCharacteristicChanged.bind(this)
    }

    protected async transportConnectAsync(background: boolean) {
        // get a device
        if (background) {
            const devices = await bleGetDevices()
            this._device = devices?.[0]
        } else {
            const device = await bleRequestDevice({
                filters: [{ namePrefix: "BBC micro:bit" }],
                optionalServices: [BLUETOOTH_JACDAC_SERVICE],
            })
            this._device = device
        }

        if (!this._device?.gatt) throw new Error("Device not found")

        // listen for disconnection
        this._device.addEventListener(
            "gattserverdisconnected",
            this.handleDisconnected,
            false
        )

        // connect to gatt
        this._server = await this._device.gatt.connect()
        // connect to service
        this._service = await this._server.getPrimaryService(
            BLUETOOTH_JACDAC_SERVICE
        )
        // connect to characteristic
        this._rxCharacteristic = await this._service.getCharacteristic(
            BLUETOOTH_JACDAC_RX_CHARACTERISTIC
        )

        this._txCharacteristic = await this._service.getCharacteristic(
            BLUETOOTH_JACDAC_TX_CHARACTERISTIC
        )
        // listen for incoming packet
        this._rxCharacteristic.addEventListener(
            "characteristicvaluechanged",
            this.handleCharacteristicChanged,
            false
        )
        // start listening
        await this._rxCharacteristic.startNotifications()
    }

    protected async transportSendPacketAsync(data: Uint8Array) {
        if (!this._txCharacteristic) {
            console.debug(`trying to send Bluetooth packet while disconnected`)
            return
        }

        const length = data.length

        const totalChunks = Math.ceil(data.length / 18)
        let remainingChunks = totalChunks == 0 ? 0 : totalChunks - 1
        let sent = 0
        while (sent < length) {
            const n = Math.min(18, length - sent)
            const chunk = data.slice(sent, sent + n)
            const header = new Uint8Array(2)
            header[0] = totalChunks & 0x7f

            if (sent == 0) header[0] |= JD_BLE_FIRST_CHUNK_FLAG

            header[1] = remainingChunks
            this._txCharacteristic.writeValueWithoutResponse(
                bufferConcat(header, chunk)
            )
            sent += n
            remainingChunks = remainingChunks == 0 ? 0 : remainingChunks - 1
            console.debug(
                `chunk: ${chunk.toString()} [${remainingChunks} chunks remaining]`
            )
        }
    }

    protected async transportDisconnectAsync() {
        if (!this._device) return

        console.debug(`ble: disconnecting`)
        try {
            this._rxCharacteristic?.removeEventListener(
                "characteristicvaluechanged",
                this.handleCharacteristicChanged
            )
            this._device?.removeEventListener(
                "gattserverdisconnected",
                this.handleDisconnected
            )
            this._server.disconnect()
        } finally {
            this._rxCharacteristic = undefined
            this._txCharacteristic = undefined
            this._service = undefined
            this._server = undefined
            this._device = undefined
            this._rxBuffer = undefined
        }
    }

    private handleDisconnected() {
        // start disconnecting
        this.disconnect()
    }

    private handleCharacteristicChanged() {
        const data = new Uint8Array(this._rxCharacteristic.value.buffer)
        const packetData = data.slice(2)
        console.debug(`received length ${data.length}`)

        if (data[0] & JD_BLE_FIRST_CHUNK_FLAG) {
            if (this._rxBuffer)
                console.error(
                    `Dropped buffer. Chunks remaining: ${this._rxChunkCounter}`
                )
            this._rxBuffer = new Uint8Array()
            this._rxChunkCounter = data[0] & 0x7f
            console.debug(`Initial chunk counter: ${this._rxChunkCounter}`)
        }

        this._rxChunkCounter =
            this._rxChunkCounter == 0 ? 0 : this._rxChunkCounter - 1
        console.debug(
            `after modification chunk counter: ${this._rxChunkCounter}`
        )

        if (data[1] !== this._rxChunkCounter)
            console.error(
                `Data out of order. Expected chunk: ${this._rxChunkCounter} Got chunk: ${data[1]}`
            )
        else this._rxBuffer = bufferConcat(this._rxBuffer, packetData)

        if (this._rxChunkCounter == 0) {
            this.bus.processFrame(this._rxBuffer, BLUETOOTH_TRANSPORT)
            this._rxBuffer = undefined
            this._rxChunkCounter = 0
        }
    }
}

/**
 * Creates a transport that uses Web Bluetooth
 * @category Transport
 */
export function createBluetoothTransport(
    options?: WebBluetoothOptions
): Transport {
    return isWebBluetoothSupported() && new BluetoothTransport(options)
}

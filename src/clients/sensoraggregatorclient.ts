import {
    SensorAggregatorReg,
    SensorAggregatorSampleType,
    SRV_SENSOR_AGGREGATOR,
} from "../../jacdac-spec/dist/specconstants"
import { bufferToArray, NumberFormat } from "../jdom/buffer"
import { JD_SERIAL_MAX_PAYLOAD_SIZE, REPORT_RECEIVE } from "../jdom/constants"
import { jdpack } from "../jdom/pack"
import { JDRegister } from "../jdom/register"
import { JDService } from "../jdom/service"
import { JDServiceClient } from "../jdom/serviceclient"
import {
    isReading,
    serviceSpecificationFromClassIdentifier,
} from "../jdom/spec"
import { assert, bufferConcat, bufferConcatMany, fromHex } from "../jdom/utils"

export interface SensorAggregatorInputConfig {
    serviceClass: number
    // if specified, also specify serviceIndex
    deviceId?: string
    serviceIndex?: number
}

export interface SensorAggregatorConfig {
    samplingInterval: number // ms
    samplesInWindow: number
    inputs: SensorAggregatorInputConfig[]
}

export interface SensorAggregatorStats {
    numSamples: number
    sampleSize: number
}

/**
 * A client for the sensor aggregator service
 * @category Clients
 */
export class SensorAggregatorClient extends JDServiceClient {
    constructor(service: JDService) {
        super(service)
        assert(service.serviceClass === SRV_SENSOR_AGGREGATOR)
        this.service.registersUseAcks = true
    }

    async setInputs(cfg: SensorAggregatorConfig) {
        function error(msg: string) {
            throw new Error("Aggregator inputs: " + msg)
        }
        function mapType(tp: number) {
            switch (tp) {
                case 1:
                    return SensorAggregatorSampleType.U8
                case 2:
                    return SensorAggregatorSampleType.U16
                case 4:
                    return SensorAggregatorSampleType.U32
                case -1:
                    return SensorAggregatorSampleType.I8
                case -2:
                    return SensorAggregatorSampleType.I16
                case -4:
                    return SensorAggregatorSampleType.I32
                default:
                    error("unknown storage type")
            }
        }

        if (!cfg || !cfg.inputs) error("invalid input format")

        let totalSampleSize = 0
        const inputs = cfg.inputs?.map(input => {
            const { deviceId, serviceIndex, serviceClass } = input
            if (!!deviceId !== !!serviceIndex)
                error(`deviceId and serviceIndex must be specified together`)
            const specification =
                serviceSpecificationFromClassIdentifier(serviceClass)
            if (!specification)
                error(
                    `missing specification from service 0x${serviceClass.toString(
                        16
                    )}`
                )
            const freeze = !!deviceId
            const readingReg = specification.packets.find(isReading)
            if (!readingReg)
                error(
                    `service 0x${serviceClass.toString(
                        16
                    )} does not have a reading register`
                )
            let sampleType: SensorAggregatorSampleType = undefined
            let sampleSize = 0
            let sampleShift = 0
            for (const field of readingReg.fields) {
                sampleSize += Math.abs(field.storage)
                if (sampleType === undefined) {
                    sampleType = mapType(field.storage)
                    sampleShift = field.shift || 0
                }
                if (
                    sampleType != mapType(field.storage) ||
                    sampleShift != (field.shift || 0)
                )
                    error("heterogenous field types")
            }
            totalSampleSize += sampleSize
            return bufferConcat(
                freeze ? fromHex(deviceId) : new Uint8Array(8),
                jdpack("u32 u8 u8 u8 i8", [
                    serviceClass,
                    freeze ? serviceIndex : 0,
                    sampleSize,
                    sampleType,
                    sampleShift,
                ])
            )
        })

        if (totalSampleSize > JD_SERIAL_MAX_PAYLOAD_SIZE)
            error("samples won't fit in packet")

        // u32 is x[4]
        inputs.unshift(
            jdpack("u16 u16 u32", [
                cfg.samplingInterval,
                cfg.samplesInWindow,
                0,
            ])
        )
        await this.service
            .register(SensorAggregatorReg.Inputs)
            .sendSetAsync(bufferConcatMany(inputs))
    }

    async collect(numSamples: number) {
        await this.service
            .register(SensorAggregatorReg.StreamingSamples)
            .sendSetPackedAsync([numSamples])
    }

    subscribeSample(handler: (sample: number[]) => void): () => void {
        const reg = this.service.register(SensorAggregatorReg.CurrentSample)
        return this.mount(
            reg.subscribe(REPORT_RECEIVE, () =>
                handler(bufferToArray(reg.data, NumberFormat.Float32LE))
            )
        )
    }

    private async getReg(id: SensorAggregatorReg, f: (v: JDRegister) => any) {
        const reg = this.service.register(id)
        await reg.refresh()
        return f(reg)
    }

    async stats(): Promise<SensorAggregatorStats> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const info: any = {
            numSamples: this.getReg(
                SensorAggregatorReg.NumSamples,
                r => r.intValue
            ),
            sampleSize: this.getReg(
                SensorAggregatorReg.SampleSize,
                r => r.intValue
            ),
        }
        for (const id of Object.keys(info)) {
            info[id] = await info[id]
        }
        return info
    }
}

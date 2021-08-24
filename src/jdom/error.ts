import { JACDAC_ERROR } from "./constants"

/**
 * Common Jacdac error type
 * @category Runtime
 */
export class JDError extends Error {
    constructor(message: string, readonly jacdacName?: string) {
        super(message)
        this.name = JACDAC_ERROR
    }
}
export default JDError

/**
 * Extract the Jacdac error code if any
 * @param e
 * @returns
 * @category Runtime
 */
export function errorCode(e: JDError): string {
    return e.name === JACDAC_ERROR ? (e as JDError)?.jacdacName : undefined
}

import {
    getNumber,
    NumberFormat,
    setNumber,
    sizeOfNumberFormat,
} from "./buffer"
import { clampToStorage, numberFormatToStorageType } from "./spec"
import { bufferEq, bufferToString, stringToBuffer } from "./utils"

/**
 * @category Data Packing
 */
export type PackedSimpleValue = number | boolean | string | Uint8Array

/**
 * @category Data Packing
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PackedValues = any[]

// ASCII codes of characters
const ch_b = 98
const ch_i = 105
const ch_r = 114
const ch_s = 115
const ch_u = 117
const ch_x = 120
const ch_z = 122
//const ch_0 = 48
//const ch_9 = 57
const ch_colon = 58
const ch_sq_open = 91
const ch_sq_close = 93

function numberFormatOfType(tp: string): NumberFormat {
    switch (tp) {
        case "u8":
            return NumberFormat.UInt8LE
        case "u16":
            return NumberFormat.UInt16LE
        case "u32":
            return NumberFormat.UInt32LE
        case "i8":
            return NumberFormat.Int8LE
        case "i16":
            return NumberFormat.Int16LE
        case "i32":
            return NumberFormat.Int32LE
        case "f32":
            return NumberFormat.Float32LE
        case "f64":
            return NumberFormat.Float64LE
        case "i64":
            return NumberFormat.Int64LE
        case "u64":
            return NumberFormat.UInt64LE
        default:
            return null
    }
}

function bufferSlice(buf: Uint8Array, start: number, end: number) {
    return buf.slice(start, end)
}

class TokenParser {
    c0: number
    size: number
    div: number
    fp = 0
    nfmt: NumberFormat
    word: string
    isArray: boolean

    constructor(public fmt: string) {}

    parse() {
        this.div = 1
        this.isArray = false

        const fmt = this.fmt
        while (this.fp < fmt.length) {
            let endp = this.fp
            while (endp < fmt.length && fmt.charCodeAt(endp) != 32) endp++
            let word = fmt.slice(this.fp, endp)
            this.fp = endp + 1
            if (!word) continue

            const dotIdx = word.indexOf(".")
            let c0 = word.charCodeAt(0)
            // "u10.6" -> "u16", div = 1 << 6
            if ((c0 == ch_i || c0 == ch_u) && dotIdx >= 0) {
                const sz0 = parseInt(word.slice(1, dotIdx))
                const sz1 = parseInt(word.slice(dotIdx + 1))
                word = word[0] + (sz0 + sz1)
                this.div = 1 << sz1
            }

            const c1 = word.charCodeAt(1)
            if (c1 == ch_sq_open) {
                this.size = parseInt(word.slice(2))
            } else {
                this.size = -1
            }

            if (
                word.charCodeAt(word.length - 1) == ch_sq_close &&
                word.charCodeAt(word.length - 2) == ch_sq_open
            ) {
                word = word.slice(0, -2)
                this.isArray = true
            }

            this.nfmt = numberFormatOfType(word)
            this.word = word

            if (this.nfmt == null) {
                if (c0 == ch_r) {
                    if (c1 != ch_colon) c0 = 0
                } else if (c0 == ch_s || c0 == ch_b || c0 == ch_x) {
                    if (word.length != 1 && this.size == -1) c0 = 0
                } else if (c0 == ch_z) {
                    if (word.length != 1) c0 = 0
                } else {
                    c0 = 0
                }
                if (c0 == 0) throw new Error(`invalid format: ${word}`)
                this.c0 = c0
            } else {
                this.size = sizeOfNumberFormat(this.nfmt)
                this.c0 = -1
            }

            return true
        }
        return false
    }
}

function jdunpackCore(buf: Uint8Array, fmt: string, repeat: number) {
    const repeatRes: any[][] = repeat ? [] : null
    let res: any[] = []
    let off = 0
    let fp0 = 0
    const parser = new TokenParser(fmt)
    if (repeat && buf.length == 0) return []
    while (parser.parse()) {
        if (parser.isArray && !repeat) {
            res.push(
                jdunpackCore(
                    bufferSlice(buf, off, buf.length),
                    fmt.slice(fp0),
                    1
                )
            )
            return res
        }

        fp0 = parser.fp
        let sz = parser.size
        const c0 = parser.c0
        if (c0 == ch_z) {
            let endoff = off
            while (endoff < buf.length && buf[endoff] != 0) endoff++
            sz = endoff - off
        } else if (sz < 0) {
            sz = buf.length - off
        }

        if (parser.nfmt !== null) {
            let v = getNumber(buf, parser.nfmt, off)
            if (parser.div != 1) v /= parser.div
            res.push(v)
            off += parser.size
        } else {
            const subbuf = bufferSlice(buf, off, off + sz)
            if (c0 == ch_z || c0 == ch_s) {
                let zerop = 0
                while (zerop < subbuf.length && subbuf[zerop] != 0) zerop++
                res.push(bufferToString(bufferSlice(subbuf, 0, zerop)))
            } else if (c0 == ch_b) {
                res.push(subbuf)
            } else if (c0 == ch_x) {
                // skip padding
            } else if (c0 == ch_r) {
                res.push(jdunpackCore(subbuf, fmt.slice(fp0), 2))
                break
            } else {
                throw new Error(`whoops`)
            }
            off += subbuf.length
            if (c0 == ch_z) off++
        }

        if (repeat && parser.fp >= fmt.length) {
            parser.fp = 0
            if (repeat == 2) {
                repeatRes.push(res)
                res = []
            }
            if (off >= buf.length) break
        }
    }

    if (repeat == 2) {
        if (res.length) repeatRes.push(res)
        return repeatRes
    } else {
        return res
    }
}

/**
 Unpacks a byte buffer into structured data as specified in the format string.
 See jdpack for format string reference.
 @category Data Packing
*/
export function jdunpack<T extends PackedValues>(
    buf: Uint8Array,
    fmt: string
): T {
    if (!buf || !fmt) return undefined

    // hot path for buffers
    if (fmt === "b") return [buf.slice(0)] as T
    // hot path
    let nf = numberFormatOfType(fmt)
    if (nf !== null) {
        let sz = sizeOfNumberFormat(nf)
        if (buf.length === 4 && nf === NumberFormat.UInt64LE) {
            nf = NumberFormat.UInt32LE
            sz = 4
        }
        if (buf.length < sz) {
            throw new Error(
                `size mistmatch, expected ${fmt} (${sz} bytes), got ${buf.length}`
            )
        }
        return [getNumber(buf, nf, 0)] as T
    }
    // slow path
    return jdunpackCore(buf, fmt, 0) as T
}

// only works for LE types
function clampWithNumberFormat(v: number, format: NumberFormat) {
    if (format == NumberFormat.Float32LE || format == NumberFormat.Float64LE)
        return v

    if (isNaN(v)) return 0

    if (format == NumberFormat.UInt32LE) {
        if (v < 0) return 0
        if (v > 0xffffffff) return 0xffffffff
        return v >>> 0
    }

    if (v < 0) {
        switch (format) {
            case NumberFormat.UInt8LE:
            case NumberFormat.UInt16LE:
                return 0
            case NumberFormat.Int8LE:
                if (v <= -0x80) return -0x80
                break
            case NumberFormat.Int16LE:
                if (v <= -0x8000) return -0x8000
                break
            case NumberFormat.Int32LE:
                if (v <= -0x80000000) return -0x80000000
                break
        }
    } else {
        switch (format) {
            case NumberFormat.UInt8LE:
                if (v >= 0xff) return 0xff
                break
            case NumberFormat.UInt16LE:
                if (v >= 0xffff) return 0xffff
                break
            case NumberFormat.Int8LE:
                if (v >= 0x7f) return 0x7f
                break
            case NumberFormat.Int16LE:
                if (v >= 0x7fff) return 0x7fff
                break
            case NumberFormat.Int32LE:
                if (v >= 0x7fffffff) return 0x7fffffff
                break
        }
    }

    return v | 0
}

function jdpackCore(
    trg: Uint8Array,
    fmt: string,
    data: PackedValues,
    off: number
) {
    //console.log({ fmt, data })
    let idx = 0
    const parser = new TokenParser(fmt)
    while (parser.parse()) {
        const c0 = parser.c0

        if (c0 == ch_x) {
            // skip padding
            off += parser.size
            continue
        }

        const dataItem = data[idx++]

        if (c0 == ch_r && dataItem) {
            const fmt0 = fmt.slice(parser.fp)
            for (const velt of dataItem as any[][]) {
                off = jdpackCore(trg, fmt0, velt, off)
            }
            break
        }

        // use temporary variable to avoid a Gatsby build bug
        let arr: any[]
        if (parser.isArray) arr = dataItem
        else arr = [dataItem]

        for (let v of arr) {
            if (parser.nfmt !== null) {
                if (typeof v != "number")
                    throw new Error(`expecting number, got ` + typeof v)
                if (trg) {
                    v *= parser.div
                    const st: jdspec.StorageType = numberFormatToStorageType(
                        parser.nfmt
                    )
                    if (parser.div == 1 && (st == 4 || st == -4))
                        // no clamping
                        v = 0 | Math.round(v)
                    else if (st != null) v = clampToStorage(Math.round(v), st)
                    setNumber(trg, parser.nfmt, off, v)
                }
                off += parser.size
            } else {
                let buf: Uint8Array
                if (typeof v === "string") {
                    if (c0 == ch_z) buf = stringToBuffer(v + "\u0000")
                    else if (c0 == ch_s) buf = stringToBuffer(v)
                    else throw new Error(`unexpected string`)
                } else if (v && typeof v === "object" && v.length != null) {
                    // assume buffer
                    if (c0 == ch_b) buf = v
                    else throw new Error(`unexpected buffer`)
                } else {
                    throw new Error(`expecting string or buffer`)
                }

                let sz = parser.size
                if (sz >= 0) {
                    if (buf.length > sz) buf = bufferSlice(buf, 0, sz)
                } else {
                    sz = buf.length
                }

                if (trg) trg.set(buf, off)
                off += sz
            }
        }
    }

    if (data.length > idx) throw new Error(`format '${fmt}' too short`)

    return off
}

/**

* Format strings are space-separated sequences of type descriptions.
* All numbers are understood to be little endian.
* The following type descriptions are supported:
* 
* - `u8`, `u16`, `u32` - unsigned, 1, 2, and 4 bytes long respectively
* - `i8`, `i16`, `i32` - similar, but signed
* - `b` - buffer until the end of input (has to be last)
* - `s` - similar, but utf-8 encoded string
* - `z` - NUL-terminated utf-8 string
* - `b[10]` - 10 byte buffer (10 is just an example, here and below)
* - `s[10]` - 10 byte utf-8 string; trailing NUL bytes (if any) are removed
* - `x[10]` - 10 bytes of padding
* 
* There is one more token, `r:`. The type descriptions following it are repeated in order
* until the input buffer is exhausted.
* When unpacking, fields after `r:` are repeated as an array of tuples.
* 
* In case there's only a single field repeating,
* it's also possible to append `[]` to its type, to get an array of values.
* 
* @category Data Packing
*/
export function jdpack<T extends PackedValues>(fmt: string, data: T) {
    if (!fmt || !data) return undefined

    // hot path for buffers
    if (fmt === "b") return (data[0] as Uint8Array)?.slice(0)

    // hot path
    const nf = numberFormatOfType(fmt)
    if (nf !== null) {
        const buf = new Uint8Array(sizeOfNumberFormat(nf))
        const st: jdspec.StorageType = numberFormatToStorageType(nf)
        let v = data[0]
        if (st != null) {
            // no clamping for U32, I32
            if (st == 4 || st == -4) v = Math.round(v) | 0
            else v = clampToStorage(Math.round(v), st)
        }
        setNumber(buf, nf, 0, v)
        return buf
    }

    // slow path
    const len = jdpackCore(null, fmt, data, 0)
    const res = new Uint8Array(len)
    jdpackCore(res, fmt, data, 0)
    return res
}

/**
 * Checks if two packed values serialize to the same buffer
 * @param fmt packing format string
 * @param left left data
 * @param right right data
 * @returns true if both data serialize to the same buffer
 * @category Data Packing
 */
export function jdpackEqual<T extends PackedValues>(
    fmt: string,
    left: T,
    right: T
) {
    if (!left !== !right) return false
    if (!left) return true

    const leftBuffer = jdpack<T>(fmt, left)
    const rightBuffer = jdpack<T>(fmt, right)
    return bufferEq(leftBuffer, rightBuffer)
}

/**
 * Check if two packed values are the same
 * @param a
 * @param b
 * @returns
 */
export function packedValuesIsEqual(a: PackedValues, b: PackedValues): boolean {
    if (a instanceof Uint8Array) {
        return b instanceof Uint8Array && bufferEq(a, b)
    } else if (Array.isArray(a)) {
        const e =
            Array.isArray(b) &&
            a.length === b.length &&
            a.every((v, i) => packedValuesIsEqual(v, b[i]))
        return e
    } else {
        return Object.is(a, b)
    }
}

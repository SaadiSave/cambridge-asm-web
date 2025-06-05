import * as Code from "./codes"
import type { Status as Stat } from "cambridge-asm-wasm"

export { Code }

export type Message<C, D = undefined> = {
    code: C
    data: D
}

function code<C>(code: C): Message<C> {
    return { code, data: undefined }
}

function withData<C, D>(code: C, data: D): Message<C, D> {
    return {
        code,
        data,
    }
}

export type Ready = Message<typeof Code.READY, { input_enabled: boolean }>
export const ready = (input_enabled: boolean): Ready => withData(Code.READY, { input_enabled })

export type Status = Message<typeof Code.STATUS, { status: Stat }>
export const status = (status: Stat): Status => withData(Code.STATUS, { status })

export type Output = Message<typeof Code.OUTPUT, { buf: Uint8Array }>
export const output = (buf: Uint8Array): Output => withData(Code.OUTPUT, { buf })

export type ParseError = Message<typeof Code.PARSE_ERROR, { e: string }>
export const parseError = (e: string): ParseError => withData(Code.PARSE_ERROR, { e })

export type WorkerMessage = Ready | Status | Output | ParseError

export type Init = Message<typeof Code.INIT, { prog: string }>
export const init = (prog: string): Init => withData(Code.INIT, { prog })
export type Step = Message<typeof Code.STEP>
export const step: Step = code(Code.STEP)
export type InputResponse = Message<typeof Code.INPUT_RESPONSE, { input: Uint8Array }>
export const inputResponse = (input: Uint8Array): InputResponse =>
    withData(Code.INPUT_RESPONSE, { input })
export type RunThrough = Message<typeof Code.RUN_THROUGH>
export const runThrough: RunThrough = code(Code.RUN_THROUGH)

export type WindowMessage = Init | Step | InputResponse | RunThrough

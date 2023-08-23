import type { Status } from "./wasm/cambridge_asm_wasm"

export enum Signal {
    Init,
    Ready,
    Done,
    Err,
    Perf,
    Out,
    Exec,
    Step,
    Status,
    Unable,
}

export type Message =
    { type: Signal.Unable | Signal.Exec | Signal.Done | Signal.Step | Signal.Ready } |
    { type: Signal.Err, error: string } |
    { type: Signal.Out, payload: Uint8Array } |
    { type: Signal.Status, status: StatusMsg } |
    { type: Signal.Perf, time: number } |
    { type: Signal.Init, prog: string, input: Uint8Array }

export type StatusMsg =
    { stat: Status.Complete | Status.Continue } |
    { stat: Status.Error, error: string }

import { Signal } from "./ipc"
import init, { Executor, Status } from "./wasm"

import type { OutputCb, ErrorCb } from "./wasm"
import type { Message } from "./ipc"


let wasmInit = false


let executor: Executor | null = null
const cleanExecutor = () => {
    executor!.free()
    executor = null
}

const unable = () => postMessage({ type: Signal.Unable } satisfies Message)

const bench = () => postMessage({ type: Signal.Perf, time: performance.now() } satisfies Message)

const outputCb = ((arr) => {
    postMessage({ type: Signal.Out, payload: arr } satisfies Message)
}) satisfies OutputCb


let lastError: string | undefined = undefined
const errorCb = ((err) => {
    lastError = err
}) satisfies ErrorCb


onmessage = async ({ data: msg }: MessageEvent<Message>) => {
    if (!wasmInit) {
        await init()
        wasmInit = true
    }

    switch (msg.type) {
        case Signal.Init:
            if (executor !== null) {
                unable()
                break
            }

            let { prog, input } = msg
            executor = new Executor(input, errorCb, outputCb, prog)

            postMessage({ type: Signal.Ready } satisfies Message)
            break
        case Signal.Exec:
            if (executor === null) {
                unable()
                break
            }

            bench()

            executor.exec()

            bench()

            cleanExecutor()
            break
        case Signal.Step:
            if (executor === null) {
                unable()
                break
            }

            const feedback = executor.step()

            switch (feedback.status) {
                case Status.Error:
                    executor.handle_err(feedback)
                    cleanExecutor()
                    break
                case Status.Complete:
                    cleanExecutor()
                    break
            }

            postMessage({ type: Signal.Status, status: { stat: feedback.status, error: lastError } } satisfies Message)

            feedback.free()

            break
        default:
            unable()
            break
    }
}


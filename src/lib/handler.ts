import { Signal } from "./ipc"
import type { Message } from "./ipc"
import { Status } from "./wasm/cambridge_asm_wasm"

export function spawn(prog: string, input: string, handleOut: (arg0: string) => void, handleTime: (arg0: number) => void): Worker {
    const enc = new TextEncoder()
    const dec = new TextDecoder()
    const worker = new Worker(new URL("worker", import.meta.url), {
        type: "module",
    })

    const sendMessage = (msg: Message) => worker.postMessage(msg)

    const step = () => sendMessage({ type: Signal.Step } satisfies Message)

    worker.postMessage({
        type: Signal.Init,
        prog,
        input: enc.encode(input),
    } satisfies Message)

    let [first, second]: Array<number | undefined> = [undefined, undefined]

    worker.onmessage = async ({ data: msg }: MessageEvent<Message>) => {
        switch (msg.type) {
            case Signal.Perf:
                let { time } = msg
                if (!first) {
                    first = time
                } else if (!second) {
                    second = time
                    handleTime(second - first)
                }
                break
            case Signal.Out:
                let { payload } = msg
                handleOut(dec.decode(payload))
                break
            case Signal.Ready:
                sendMessage({ type: Signal.Exec } satisfies Message)
                break
            case Signal.Status:
                let { status } = msg
                switch (status.stat) {
                    case Status.Complete:
                        break
                    case Status.Error:
                        let err = status.error
                        break
                    case Status.Continue:
                        step()
                        break
                }
                break
            default:
                break
        }
    }

    return worker
}

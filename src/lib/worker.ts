/// <reference lib="WebWorker" />

import init, { set_panic_hook, PasmExecutor, set_input_buffer } from "cambridge-asm-wasm"
import * as msg from "./messages"
import * as Code from "./codes"

const postMsgChecked = (m: msg.WorkerMessage) => postMessage(m)

let exec: PasmExecutor | null = null

onmessage = async ({ data: m }: MessageEvent<msg.WindowMessage>) => {
    console.log(m)
    switch (m.code) {
        case msg.Code.INIT:
            await init()
            set_panic_hook()
            try {
                exec = new PasmExecutor(m.data.prog, (buf) => postMsgChecked(msg.output(buf)))
                postMsgChecked(msg.ready(exec.input_enabled))
            } catch (e) {
                postMsgChecked(msg.parseError((e as { toString(): string }).toString()))
            }
            break
        case msg.Code.STEP:
            postMsgChecked(msg.status(exec!.step()))
            break
        case msg.Code.INPUT_RESPONSE:
            set_input_buffer(m.data.input)
            postMsgChecked(msg.status(exec!.step()))
            break
        case msg.Code.RUN_THROUGH:
            exec!.run_without_input()
            postMsgChecked(msg.status({ status: Code.COMPLETE, data: undefined }))
            break
        default:
            break
    }
}

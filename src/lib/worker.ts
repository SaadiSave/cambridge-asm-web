/// <reference lib="WebWorker" />

import init, { set_panic_hook, PasmExecutor, set_input_buffer } from "cambridge-asm-wasm"
import * as msg from "./messages"

const postMsgChecked = (m: msg.WorkerMessage) => postMessage(m)

let exec: PasmExecutor | null = null

onmessage = async ({ data: m }: MessageEvent<msg.WindowMessage>) => {
    console.log(m)
    switch (m.code) {
        case msg.Code.INIT:
            await init()
            set_panic_hook()
            exec = new PasmExecutor(m.data.prog, (buf) => postMsgChecked(msg.output(buf)))
            postMsgChecked(msg.ready)
            break
        case msg.Code.STEP:
            postMsgChecked(msg.status(exec!.step()))
            break
        case msg.Code.INPUT_RESPONSE:
            set_input_buffer(m.data.input)
            postMsgChecked(msg.status(exec!.step()))
            break
        default:
            break
    }
}

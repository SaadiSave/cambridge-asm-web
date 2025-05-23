import type { OutputCB, Status } from "cambridge-asm-wasm"
import * as msg from "./messages"

export default class PasmWorker {
    #worker: Worker
    #ready: boolean = false
    #status?: Status
    get status() {
        return this.#status ?? null
    }
    #complete: boolean = false
    get complete() {
        return this.#complete
    }
    constructor(
        prog: string,
        inputCB: (to_newline: boolean) => Promise<Uint8Array>,
        outputCB: OutputCB,
        errorCB: (error: string) => void
    ) {
        this.#worker = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" })
        this.postMsgChecked(msg.init(prog))

        this.#worker.onmessage = async ({ data: m }: MessageEvent<msg.WorkerMessage>) => {
            console.log(m)
            switch (m.code) {
                case msg.Code.READY:
                    this.#ready = true
                    this.step()
                    break
                
                case msg.Code.OUTPUT:
                    outputCB(m.data.buf)
                    break

                case msg.Code.STATUS:
                    this.#status = m.data.status
                    switch (this.#status.status) {
                        case msg.Code.INPUT_REQUEST:
                            {
                                const input = await inputCB(this.#status.data)
                                this.postMsgChecked(msg.inputResponse(input))
                            }
                            break
                        case msg.Code.CONTINUE:
                            this.step()
                            break
                        case msg.Code.COMPLETE:
                            this.#finish()
                            break
                        case msg.Code.ERROR:
                            errorCB(this.#status.data)
                            this.#finish()
                            break
                        default:
                            break
                    }
                    break
                
                default:
                    break
            }
        }
    }

    postMsgChecked(m: msg.WindowMessage) {
        this.#worker.postMessage(m)
    }

    step(): boolean {
        if (!this.#ready) {
            return false
        }

        this.postMsgChecked(msg.step)
        return true
    }

    #finish() {
        this.#complete = true
        this.#worker.terminate()
    }
}

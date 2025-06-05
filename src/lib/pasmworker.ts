import type { OutputCB, Status } from "cambridge-asm-wasm"
import * as msg from "./messages"
import { waitUntil } from "./waituntil"

type InputHandler = (to_eol: boolean) => Promise<Uint8Array>
type ErrorHandler = (error: string) => void

export default class PasmWorker {
    #worker: Worker
    ready: boolean = false
    inputEnabled: boolean = false
    onInput: InputHandler
    onError: ErrorHandler
    statusIsFresh: boolean = false
    #status?: Status
    get status() {
        return this.#status ?? null
    }
    #complete: boolean = false
    get complete() {
        return this.#complete
    }
    #elapsed: number = 0
    reportPerf: (t: number) => void
    constructor(
        prog: string,
        onInput: InputHandler,
        onOutput: OutputCB,
        onError: ErrorHandler,
        reportPerf: (t: number) => void
    ) {
        this.#worker = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" })
        this.onInput = onInput
        this.onError = onError
        this.reportPerf = reportPerf
        this.#postMsgChecked(msg.init(prog))

        this.#worker.onmessage = async ({ data: m }: MessageEvent<msg.WorkerMessage>) => {
            console.log(m)
            switch (m.code) {
                case msg.Code.READY:
                    this.ready = true
                    this.inputEnabled = m.data.input_enabled
                    break

                case msg.Code.OUTPUT:
                    onOutput(m.data.buf)
                    break

                case msg.Code.STATUS:
                    this.#status = m.data.status
                    this.statusIsFresh = true
                    switch (this.#status.status) {
                        case msg.Code.COMPLETE:
                            this.#terminate()
                            break
                        case msg.Code.ERROR:
                            this.onError(this.#status.data)
                            this.#terminate()
                            break
                        default:
                            break
                    }
                    break

                case msg.Code.PARSE_ERROR:
                    onError(m.data.e)
                    break

                default:
                    break
            }
        }
    }

    #postMsgChecked(m: msg.WindowMessage) {
        this.#worker.postMessage(m)
    }

    async run() {
        await waitUntil(() => this.ready, 0)

        this.#elapsed = performance.now()
        if (this.inputEnabled) {
            this.#postMsgChecked(msg.step)
            while (!this.#complete) {
                await waitUntil(() => this.statusIsFresh, 0)
                await this.step()
            }
        } else {
            this.#postMsgChecked(msg.runThrough)
        }
    }

    async step() {
        this.statusIsFresh = false
        switch (this.#status?.status) {
            case msg.Code.INPUT_REQUEST:
                {
                    const input = await this.onInput(this.#status.data)
                    this.#postMsgChecked(msg.inputResponse(input))
                }
                break
            case msg.Code.CONTINUE:
                this.#postMsgChecked(msg.step)
                break
            default:
                break
        }
    }

    #terminate() {
        this.#complete = true
        this.#elapsed = performance.now() - this.#elapsed
        this.reportPerf(this.#elapsed)
        this.#worker.terminate()
    }
}

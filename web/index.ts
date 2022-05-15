import type { InitMsg, Msg } from "./worker"
import { Signal } from "./worker"

// from https://stackoverflow.com/a/62963963
const supportsWorkerType = () => {
    let supports = false
    const tester = {
        // @ts-ignore
        get type() {
            supports = true
        }, // it's been called, it's supported
    }
    try {
        // We use "blob://" as url to avoid a useless network request.
        // This will either throw in Chrome
        // either fire an error event in Firefox
        // which is perfect since
        // we don't need the worker to actually start,
        // checking for the type of the script is done before trying to load it.
        // @ts-ignore
        const _ = new Worker("blob://", tester)
    } finally {
        // noinspection ReturnInsideFinallyBlockJS
        return supports
    }
}

const main = async () => {
    const raiseError = (dialogBox: HTMLDivElement, out: HTMLParagraphElement, msg: string) => {
        dialogBox.style.display = "block"
        out.innerText = msg
    }
    
    const _err = {
        dialogBox: document.getElementById("error") as HTMLDivElement,
        out: document.getElementById("errorContent") as HTMLParagraphElement,
    }

    const errorReporter = (msg: string) => raiseError(_err.dialogBox, _err.out, msg)

    const output = document.getElementById("output") as HTMLTextAreaElement
    const timer = document.getElementById("timer") as HTMLParagraphElement

    const btn = document.getElementById("run") as HTMLButtonElement
    btn.onclick = () => {
        const worker = new Worker("./worker.js", { type: "module" })
        const decoder = new TextDecoder()
        worker.postMessage({
            check: Signal.Init,
            input: (document.getElementById("input") as HTMLTextAreaElement).value,
            prog: (document.getElementById("prog") as HTMLTextAreaElement).value,
        } as InitMsg)

        let first: number | undefined = undefined
        let second: number | undefined = undefined

        worker.onmessage = (msg: MessageEvent<Msg>) => {
            const dat = msg.data
            if (dat.check) {
                switch (dat.check) {
                    case Signal.Out:
                        const str = decoder.decode(dat.bytes)
                        output.value = `${output.value}${str}`
                        break

                    case Signal.Perf:
                        if (!first) {
                            first = dat.time
                        } else if (!second) {
                            second = dat.time
                            timer.innerText = `${second - first} ms`
                        }
                        break

                    case Signal.Err:
                        errorReporter(dat.message)
                        break

                    case Signal.Kill:
                        worker.terminate()
                        break

                    default:
                        throw Error(`Invalid message from worker: ${msg}`)
                }
            } else {
                throw Error(`Invalid message from worker: ${msg}`)
            }
        }
    }
}

(async () => {
    if (screen.availHeight > screen.availWidth) {
        alert("Portrait mode is not supported. Please tilt your device.")
    }

    {

        const errorHead = document.getElementById("errorHead") as HTMLHeadingElement
        errorHead.innerText = "Instructions"

        const errorContent = document.getElementById("errorContent") as HTMLParagraphElement
        errorContent.innerText = `1. Leave a blank line between the program and memory
2. Type in all the input that will be needed by the program during runtime in the "Input" textbox`

        document.getElementById("error")!.style.display = "block"
    }

    if (supportsWorkerType()) {
        await main()
    } else {
        // @ts-ignore
        const _ = await import("./module-workers-polyfill-0.3.2.min.js")

        await main()
    }
})()

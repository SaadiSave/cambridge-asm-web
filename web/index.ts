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

const registerSW = async () => {
    if (navigator.serviceWorker) {
        try {
            const reg: ServiceWorkerRegistration = await navigator.serviceWorker.register("/sw/sw.js", {scope: "/"})

            if (reg.installing) {
                console.log("Installing service worker")
            } else if (reg.waiting) {
                console.log("Service worker installed")
            } else if (reg.active) {
                console.log("Service worker active")
            }
        } catch (e) {
            console.error(`Registration failed with ${e}`)
        }
    }
}

const main = async () => {
    registerSW().then()

    const output = document.getElementById("output") as HTMLTextAreaElement
    const timer = document.getElementById("timer") as HTMLParagraphElement

    const btn = document.getElementById("run") as HTMLButtonElement
    btn.onclick = () => {
        const worker = new Worker("./worker.js", {type: "module"})
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
                        alert(dat.message)
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
    if (supportsWorkerType()) {
        await main()
    } else {
        // @ts-ignore
        const _ = await import("./module-workers-polyfill-0.3.2.min.js")

        await main()
    }
})()

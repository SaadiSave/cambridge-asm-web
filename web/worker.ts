import init, { exec, Input, Output } from "./cambridge_asm_web.js"

export const enum Signal {
    Init,
    Kill,
    Err,
    Perf,
    Out,
}

export type Msg = KillMsg | ErrorMsg | OutputMsg | PerfMsg

export type InitMsg = {
    check: Signal.Init,
    input: string,
    prog: string,
}

export type KillMsg = {
    check: Signal.Kill
}

export type ErrorMsg = {
    check: Signal.Err,
    message: string,
}

export type OutputMsg = {
    check: Signal.Out,
    bytes: Uint8Array,
}

export type PerfMsg = {
    check: Signal.Perf,
    time: number,
}

{
    const argsToString = (...args: any[]) => {
        let msg = ""
        for (const arg of args) {
            msg += `${arg}`
        }
        return msg
    }
    const error = console.error.bind(console)
    console.error = (...args: any[]) => {
        postMessage({
            check: Signal.Err,
            message: argsToString(args),
        } as ErrorMsg)

        error(...args)
    }
}

onmessage = async (msg: MessageEvent<InitMsg>) => {
    await init()

    let dat = msg.data
    if (dat.check === Signal.Init) {
        const input = new Input(dat.input)
        const output = new Output((s: Uint8Array) => {
            postMessage({
                check: Signal.Out,
                bytes: s,
            } as OutputMsg)
        })

        postMessage({
            check: Signal.Perf,
            time: performance.now(),
        } as PerfMsg)

        try {
            exec(input, output, dat.prog)
        } finally {
            postMessage({
                check: Signal.Perf,
                time: performance.now(),
            } as PerfMsg)

            postMessage({
                check: Signal.Kill,
            } as KillMsg)
        }
    } else {
        throw new Error(`Invalid message from main: ${msg}`)
    }
}

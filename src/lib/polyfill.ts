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
        const blob = new Blob(["function foo() {}"], {
            type: "application/javascript"
        })
        // @ts-ignore
        const _ = new Worker(URL.createObjectURL(blob), tester)
    } finally {
        // noinspection ReturnInsideFinallyBlockJS
        return supports
    }
}

export default async function polyfill() {
    // @ts-ignore
    if (!supportsWorkerType()) await import("module-workers-polyfill")
}

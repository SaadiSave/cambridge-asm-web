<script lang="ts">
    import PasmWorker from "$lib/pasmworker"
    import Button from "$lib/components/Button.svelte"
    import Editor from "$lib/components/Editor.svelte"
    import Label from "$lib/components/Label.svelte"
    import { browser } from "$app/environment"
    import { mount, unmount } from "svelte"
    import Input from "$lib/components/modal/Input.svelte"
    import Help from "$lib/components/modal/Help.svelte"
    import Error from "$lib/components/modal/Error.svelte"

    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    const DEFAULT_PROGRAM = `out #65
out #10
end

none:
`

    let prog = $state(
        browser ? (sessionStorage.getItem("program") ?? DEFAULT_PROGRAM) : DEFAULT_PROGRAM
    )

    $effect(() => {
        if (browser) sessionStorage.setItem("program", prog)
    })

    let currentModal: unknown

    let output = $state("")

    let introModal = $state(false)

    $effect(() => {
        if (introModal) {
            currentModal = mount(Help, {
                target: document.body,
                props: { onDone: () => (introModal = false) },
            })
        } else {
            if (currentModal) unmount(currentModal, { outro: true })
        }
    })

    let inputModal = $state(false)
    let input = $state("")

    $effect(() => {
        if (inputModal) {
            currentModal = mount(Input, {
                target: document.body,
                props: {
                    onDone: () => (inputModal = false),
                    onInput: (val) => (input = val),
                },
            })
        } else {
            if (currentModal) unmount(currentModal, { outro: true })
        }
    })

    let errorModal = $state(false)
    let error = $state("")

    $effect(() => {
        if (errorModal) {
            currentModal = mount(Error, {
                target: document.body,
                props: { onDone: () => (errorModal = false), error },
            })
        } else {
            if (currentModal) unmount(currentModal, { outro: true })
        }
    })

    function inputCB(to_eol: boolean): Promise<Uint8Array> {
        inputModal = true
        return new Promise((resolve) => {
            const check = () => {
                if (!inputModal) {
                    // parse escape sequences
                    input = Function('"use strict";return "' + input + '"')()
                    if (to_eol) {
                        input += "\n"
                    } else {
                        input = input.at(0) ?? ""
                    }
                    resolve(encoder.encode(input))
                    input = ""
                } else {
                    setTimeout(check, 20)
                }
            }

            check()
        })
    }

    function outputCB(buf: Uint8Array) {
        output += decoder.decode(buf)
    }

    function errorCB(err: string) {
        error = err
        errorModal = true
    }

    let elapsed = $state("0")

    async function run() {
        const worker = new PasmWorker(prog, inputCB, outputCB, errorCB, (t) => {
            console.log(`Got perf: ${t} ms elapsed`)
            elapsed = t.toFixed(0)
        })
        try {
            await worker.run()
        } catch (e) {
            console.error(e)
        }
    }
</script>

<div class="flex min-h-screen flex-col gap-3 p-2">
    <header class="flex flex-shrink flex-row justify-between pb-1 font-serif">
        <div>
            <h1 class="pb-1 text-2xl">Cambridge Pseudo-assembly Playground</h1>
            <h2 class="text-lg italic">
                For Cambridge International AS and A Level Computer Science, 9618 (from 2021)
            </h2>
        </div>
        <img class="invisible h-16 align-middle sm:visible" src="/CASM.svg" alt="logo" />
    </header>
    <main class="flex flex-grow flex-col gap-3">
        <div class="flex min-w-full flex-grow text-base" style="max-height: 60vh;">
            <Editor bind:prog />
        </div>
        <div class="flex flex-col gap-4 md:flex-row">
            <div
                class="flex flex-grow flex-col gap-2 rounded-md border border-solid border-black pb-2 dark:border-slate-200"
            >
                <div class="flex justify-between rounded-t-md bg-gray-300 p-2 dark:bg-slate-900">
                    <Label for="output">
                        <h2 class="text-lg">Output</h2>
                    </Label>
                    <div><pre>{elapsed} ms elapsed</pre></div>
                </div>
                <div
                    style="flex-basis: 0;"
                    class="max-h-32 min-h-32 flex-grow font-mono md:max-h-52 md:min-h-52"
                >
                    <output name="output">
                        <pre
                            class="max-h-full min-h-full overflow-auto text-wrap px-2">{output}</pre>
                    </output>
                </div>
            </div>
            <div class="flex min-w-60 max-w-full flex-col gap-4">
                <Button class="bg-green-300 dark:bg-green-900" onclick={run}>Run</Button>
                <Button class="bg-orange-300 dark:bg-orange-900" onclick={() => (output = "")}
                    >Clear Output</Button
                >
                <Button class="bg-red-300 dark:bg-red-900" onclick={() => sessionStorage.clear()}
                    >Clear Browser Storage</Button
                >
                <Button class="bg-blue-300 dark:bg-blue-900" onclick={() => (introModal = true)}
                    >Help</Button
                >
            </div>
        </div>
    </main>
</div>

<style lang="postcss">
    h1 {
        @apply text-2xl;
    }

    h2 {
        @apply text-xl;
    }
</style>

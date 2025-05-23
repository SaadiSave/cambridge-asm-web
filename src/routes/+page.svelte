<script lang="ts">
    import PasmWorker from "$lib/pasmworker"

    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    let op = $state("")
    let modal = $state(false)
    let inputModal: HTMLDivElement | null = $state(null)

    $effect(() => {
        if (modal) {
            inputModal!.style.visibility = "visible"
        } else {
            inputModal!.style.visibility = "hidden"
        }
    })

    let input = $state("")
    let prog = $state(`ldm #65
out
in
out
end

none:
`)
    let buttonEl: HTMLButtonElement | null = $state(null)

    function inputCB(to_newline: boolean): Promise<Uint8Array> {
        modal = true
        return new Promise((resolve) => {
            const listener = () => {
                buttonEl!.onclick = null
                modal = false
                if (to_newline) {
                    input += "\n"
                } else {
                    input = input.at(0) ?? ""
                }
                resolve(encoder.encode(input))
                input = ""
            }
            buttonEl!.onclick = listener
        })
    }

    function outputCB(output: Uint8Array) {
        op += decoder.decode(output)
    }

    function errorCB(err: string) {
        alert(err)
    }

    function run() {
        new PasmWorker(prog, inputCB, outputCB, errorCB)
    }
</script>

<textarea bind:value={prog} class="w-200 h-20"></textarea>
<div class="h-20 w-20">{op}</div>
<div bind:this={inputModal} class="absolute inset-x-1/4 inset-y-1/4 h-1/2 w-1/2">
    <label for="input">Enter the input</label>
    <textarea name="input" bind:value={input}></textarea>
    <button bind:this={buttonEl}>Done</button>
</div>
<button onclick={run}>Run</button>

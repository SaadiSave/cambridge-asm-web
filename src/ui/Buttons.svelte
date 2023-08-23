<script lang="ts">
    import ClearAll from "../assets/clear_all_FILL0_wght400_GRAD0_opsz48.svg"
    import Run from "../assets/play_arrow_FILL0_wght400_GRAD0_opsz48.svg"
    import { spawn } from "../lib/handler"
    import { elapsed, input, output, prog } from "../lib/stores"

    let width: number

    const run = () => {
        spawn(
            $prog,
            $input,
            (out) => {
                output.update((s) => s + out)
            },
            (time) => {
                elapsed.set(`${time} ms`)
            }
        )
    }

    const clear = () => {
        output.set("")
    }
</script>

<svelte:window bind:innerWidth={width} />

<div class="buttons">
    {#if width < 600}
        <button type="submit" on:click={run}><img src={Run} alt="Run" /></button
        >
        <button type="reset" on:click={clear}
            ><img src={ClearAll} alt="Clear Output" /></button
        >
    {:else}
        <button type="submit" on:click={run}>Run</button>
        <button type="reset" on:click={clear}>Clear Output</button>
    {/if}
</div>

<style>
    .buttons {
        display: flex;
        flex-direction: row;
        gap: 5px;
    }
</style>

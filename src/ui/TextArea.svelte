<script lang="ts">
    import type { Writable } from "svelte/store"

    export let label: string = "Output"
    export let store: Writable<string>
    export let readOnly: boolean = false

    const uuid = crypto.randomUUID()
</script>

<style>
    .root {
        display: flex;
        flex-flow: column;
        gap: 7px;
        flex: 1;
    }
    .flex-content {
        flex: 1 1 100%;
    }
    .flex-label {
        flex: 0 1 auto;
    }
    textarea {
        box-sizing: border-box;
        font-family: "Jetbrains Mono", monospace;
        font-size: 12pt;
        height: 100%;
        width: 100%;
    }
</style>

<div class="root">
    <div class="flex-label">
        <label for="{uuid}">{label}</label>
    </div>
    <div class="flex-content">
        <textarea readonly={readOnly} id="{uuid}" bind:value={$store}></textarea>
    </div>
</div>

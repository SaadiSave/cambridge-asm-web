<script lang="ts">
    import editor from "./editor"

    import { onMount, onDestroy } from "svelte"
    import type { EditorView } from "@codemirror/view"
    import type { Store } from "../../lib/stores"

    export let store: Store<string>

    let anchor: HTMLElement
    let view: EditorView | undefined

    onMount(() => (view = editor(anchor, store)))

    onDestroy(() => view?.destroy())
</script>

<div bind:this={anchor} />

<style>
    div {
        overflow: auto;
        width: auto;
        flex: 0 0 100%;
        font-family: "Jetbrains Mono", monospace;
        font-size: 12pt;
    }
</style>

<script lang="ts">
    import Modal from "../Modal.svelte"

    let { onDone, error }: { onDone: () => void; error: string } = $props()
</script>

<Modal {onDone}>
    <pre
        aria-label="Runtime Error"
        style="white-space: pre-wrap;"
        class="text-wrap p-1 text-left font-mono">{error}</pre>
</Modal>

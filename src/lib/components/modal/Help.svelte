<script lang="ts">
    import Modal from "../Modal.svelte"

    let { onDone }: { onDone: () => void } = $props()
</script>

<Modal {onDone}>
    <h1 class="text-2xl">Instructions</h1>
    <p class="text-left">
        1. Leave a blank line between the program and memory<br />2. Input popups will appear during
        execution if needed
    </p>
</Modal>

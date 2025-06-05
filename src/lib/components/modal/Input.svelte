<script lang="ts">
    import Label from "../Label.svelte"
    import Modal from "../Modal.svelte"

    let { onDone, onInput }: { onDone: () => void; onInput: (val: string) => void } = $props()

    let value = $state("")
    $effect(() => onInput(value))
</script>

<Modal dismissMsg="Send" {onDone}>
    <Label for="input"><h2 class="text-2xl">Input</h2></Label>
    <input
        class="border-1 rounded-lg border-solid border-black p-1 font-mono dark:bg-gray-700"
        name="input"
        bind:value
        type="text"
    />
</Modal>

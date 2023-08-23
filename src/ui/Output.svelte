<script lang="ts">
    import type { Writable } from "svelte/store"
    import TextArea from "./TextArea.svelte"

    export let store: Writable<string>
    export let label: string
</script>

<TextArea store={store} label={label} readOnly={true}/>

<script lang="ts">
    import type { HTMLLabelAttributes } from "svelte/elements"

    // eslint-disable-next-line
    let { children, ...props }: HTMLLabelAttributes = $props()
</script>

<label {...props}>
    {#if children}
        {@render children()}
    {/if}
</label>

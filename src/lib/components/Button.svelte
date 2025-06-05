<script lang="ts">
    import type { HTMLButtonAttributes } from "svelte/elements"

    // eslint-disable-next-line
    let { children, class: classes, ...props }: HTMLButtonAttributes = $props()
</script>

<button
    class="h-full w-full flex-grow text-wrap rounded-md border border-solid border-black p-2 text-xl dark:border-slate-200 {classes}"
    {...props}
>
    {#if children}
        {@render children()}
    {/if}
</button>

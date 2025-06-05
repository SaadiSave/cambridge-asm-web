<script lang="ts">
    import type { Snippet } from "svelte"
    import Button from "./Button.svelte"

    let {
        dismissMsg = "Ok",
        onDone = () => {},
        children,
    }: {
        dismissMsg?: string
        onDone?: () => void
    } & { children?: Snippet } = $props()

    const btnOnClick = () => {
        onDone()
    }
</script>

<div class="absolute inset-x-1/4 inset-y-1/4 flex h-1/2 w-1/2 items-center justify-center">
    <div
        class="flex flex-col gap-4 rounded-2xl border border-solid border-black bg-gray-300 p-4 text-center dark:border-slate-200 dark:bg-slate-900"
    >
        {#if children}
            {@render children()}
        {/if}
        <Button onclick={btnOnClick}>{dismissMsg}</Button>
    </div>
</div>

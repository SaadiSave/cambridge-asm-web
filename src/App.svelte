<script lang="ts">
    import Editable from "./ui/Editable.svelte"
    import Output from "./ui/Output.svelte"
    import Buttons from "./ui/Buttons.svelte"
    import Grid from "./ui/Grid.svelte"
    import CodeEditor from "./ui/editor/CodeEditor.svelte"

    import { elapsed, input, output, prog } from "./lib/stores.js"
</script>

<main>
    <Grid>
        <CodeEditor slot="editor" store={prog} />
        <!-- <Editable slot="editor" label="Program" store={prog} /> -->
        <Editable slot="input" label="Input" store={input} />
        <Output slot="output" label="Output" store={output} />
        <Output slot="elapsed" label="Elapsed" store={elapsed} />
        <Buttons slot="buttons" />
    </Grid>
    <!-- <CodeEditor store={prog} /> -->
</main>

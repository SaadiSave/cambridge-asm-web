<script lang="ts">
    const enum Orientation {
        Portrait = "portrait",
        Landscape = "landscape",
    }

    let height: number
    let width: number

    $: orientation =
        height > width ? Orientation.Portrait : Orientation.Landscape

    $: wide = width > 700

    $: tall = height > 1000
    
    $: finalDecision = (() => {
        switch (orientation) {
            case Orientation.Portrait:
                return orientation
            case Orientation.Landscape:
                return tall ? Orientation.Portrait : Orientation.Landscape
        }
    })()
</script>

<svelte:window bind:innerWidth={width} bind:innerHeight={height} />

<div class="grid {finalDecision}">
    <div class="editor {finalDecision}">
        <slot name="editor" />
    </div>
    <div class="input">
        <slot name="input" />
    </div>
    <div class="output {finalDecision}">
        <slot name="output" />
    </div>
    <div class="elapsed">
        <slot name="elapsed" />
    </div>
    <div class="buttons">
        <slot name="buttons" />
    </div>
</div>

<style>
    .grid {
        display: grid;
        gap: 10px;
        min-height: 0;
        min-width: 0;
        width: 100%;
        height: 100%;
    }

    .grid.portrait {
        grid-template-rows: 39vh auto auto auto auto;
        grid-template-columns: auto;
        grid-template-areas: "editor"
                             "input"
                             "buttons"
                             "elapsed"
                             "output";
    }

    .grid.landscape {
        grid-template-rows: auto 5fr auto;
        grid-template-columns: 2fr 1fr;
        grid-template-areas: "editor elapsed"
                             "editor output"
                             "input buttons";
    }

    .editor, .input, .output, .buttons, .elapsed {
        display: flex;
    }
    .buttons {
        grid-area: buttons;
    }
    .editor {
        grid-area: editor;
        min-width: 0;
        min-height: 0;
    }
    .editor.landscape {
        max-height: 79vh;
    }
    .editor.portrait {
        max-height: 39vh;
    }
    .input {
        grid-area: input;
    }
    .output {
        grid-area: output;
    }
    .output.landscape {
        min-height: 45vh;
    }
    .output.portrait {
        min-height: 19vh;
    }
    .elapsed {
        grid-area: elapsed;
    }
</style>

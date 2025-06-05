<script lang="ts">
    import { EditorView, lineNumbers, keymap, type KeyBinding } from "@codemirror/view"
    import { indentLess, indentMore, standardKeymap } from "@codemirror/commands"
    import { onMount } from "svelte"
    import type { StateCommand } from "@codemirror/state"

    let { prog = $bindable() }: { prog: string } = $props()

    let editor: HTMLDivElement

    let view: EditorView // eslint-disable-line @typescript-eslint/no-unused-vars
    // false positive, likely due to incorrect ASI. Report issue.

    const insertIndent: StateCommand = ({ state, dispatch }) => {
        if (state.selection.ranges.some((r) => !r.empty)) return indentMore({ state, dispatch })
        dispatch(
            state.update(state.replaceSelection("  "), { scrollIntoView: true, userEvent: "input" })
        )
        return true
    }

    const indentHandler: KeyBinding = { key: "Tab", run: insertIndent, shift: indentLess }

    onMount(() => {
        let dark = window.matchMedia("(prefers-color-scheme: dark)").matches

        const initEditor = (dark: boolean) => {
            editor.innerHTML = ""

            const theme = EditorView.theme(
                {
                    "&": {
                        width: "100%",
                        height: "100%",
                    },
                    ".cm-gutters": {
                        "border-radius": "0.5rem 0 0 0.5rem",
                    },
                    ".cm-scroller": {
                        "font-family": "inherit",
                        "overflow-x": "auto",
                        "max-width": "100%",
                        width: "100%",
                    },
                    ".cm-content": {
                        "white-space": "pre",
                    },
                },
                { dark }
            )

            view = new EditorView({
                doc: prog,
                parent: editor,
                extensions: [
                    lineNumbers(),
                    keymap.of([indentHandler, ...standardKeymap]),
                    EditorView.updateListener.of((u) => {
                        prog = u.state.doc.toString()
                    }),
                    theme,
                ],
            })

            const innerdiv = document.querySelector("div.cm-content")

            if (innerdiv) innerdiv.ariaLabel = "code"
        }

        initEditor(dark)

        setInterval(() => {
            if (dark != window.matchMedia("(prefers-color-scheme: dark)").matches) {
                dark = window.matchMedia("(prefers-color-scheme: dark)").matches
                initEditor(dark)
            }
        }, 100)
    })
</script>

<div class="w-full max-w-full">
    <div
        bind:this={editor}
        class="h-full w-full max-w-full overflow-x-auto rounded-lg border border-solid border-black font-mono dark:border-slate-200"
    ></div>
</div>

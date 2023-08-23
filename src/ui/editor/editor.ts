import {
    EditorState,
    StateField,
    StateEffect,
    RangeSet,
} from "@codemirror/state"
import {
    EditorView,
    keymap,
    lineNumbers,
    gutter,
    GutterMarker,
} from "@codemirror/view"
import { defaultKeymap } from "@codemirror/commands"
import { basicSetup } from "codemirror"
import type { Store } from "../../lib/stores"

const breakpointEffect = StateEffect.define<{ pos: number; on: boolean }>({
    map: (val, mapping) => ({ pos: mapping.mapPos(val.pos), on: val.on }),
})

const breakpointMarker = new (class extends GutterMarker {
    toDOM() {
        return document.createTextNode("⏺")
    }
})()

const breakpointState = StateField.define<RangeSet<GutterMarker>>({
    create() {
        return RangeSet.empty
    },
    update(set, transaction) {
        set = set.map(transaction.changes)
        for (let e of transaction.effects) {
            if (e.is(breakpointEffect)) {
                if (e.value.on)
                    set = set.update({
                        add: [breakpointMarker.range(e.value.pos)],
                    })
                else
                    set = set.update({
                        filter: (from) => from != e.value.pos,
                    })
            }
        }

        /* const setIter = (function* () {
            let iter = set.iter(0)
            let next
            while (true) {
                next = iter.value
                if (next === null) {
                    break
                } else {
                    yield next
                    iter.next()
                }
            }
        })

        for (const range of setIter()) {
            console.log(range);   
        } */

        return set
    },
})

function toggleBreakpoint(view: EditorView, pos: number) {
    let breakpoints = view.state.field(breakpointState)
    let hasBreakpoint = false
    const line = view.state.doc.lineAt(pos)
    const lineString = line.text.trimStart()

    if (lineString.length === 0 || lineString.startsWith("//")) { return } else { 
        // add line number to store
    }

    breakpoints.between(pos, pos, () => {
        hasBreakpoint = true
    })

    view.dispatch({
        effects: breakpointEffect.of({ pos, on: !hasBreakpoint }),
    })
}

const breakpointGutter = [
    breakpointState,
    gutter({
        class: "cm-breakpoint-gutter",
        markers: (v) => v.state.field(breakpointState),
        initialSpacer: () => breakpointMarker,
        domEventHandlers: {
            mousedown(view, line) {
                toggleBreakpoint(view, line.from)
                return true
            },
        },
    }),
    EditorView.baseTheme({
        ".cm-breakpoint-gutter .cm-gutterElement": {
            color: "red",
            paddingLeft: "5px",
            cursor: "default",
            fontSize: "13px"
        },
    }),
]

const theme = EditorView.theme({
    ".cm-gutters": {
        color: "rgba(255, 255, 255, 0.87)",
        backgroundColor: "#242424",
    },
    ".cm-content": {
        caretColor: "rgba(255, 255, 255, 0.87)",
    },
})

export default function editor(anchor: HTMLElement, prog: Store<string>): EditorView {
    let program = prog.read()

    const updateStore = StateField.define({
        create() { },
        update(_, tr) {
            prog.set(tr.newDoc.sliceString(0))
        }
    })

    let view = new EditorView({
        state: EditorState.create({
            doc: program,
            extensions: [
                basicSetup,
                keymap.of(defaultKeymap),
                breakpointGutter,
                // lineNumbers(),
                // theme,
                updateStore,
            ],
        }),
        parent: anchor,
    })

    return view
}

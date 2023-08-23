import type { Writable } from "svelte/store"
import { writable } from "svelte/store"

export interface Store<T> extends Writable<T> {
    read(): T
}

function toStore<T>(inner: Writable<T>): Store<T> {
    Object.defineProperty(inner, "read", {
        value: function () {
            let ret: T
            const unsubscribe = this.subscribe(v => ret = v)
            unsubscribe()
            return ret!
        },
        writable: false,
    } as ThisType<Writable<T>>)

    return inner as Store<T>
}

const defaultProg = `out #65 // 'A'
out #10 // newline
end

none:`

export const prog = toStore(writable(defaultProg))

export const breakpoints = writable([] as number[])

export const output = writable("")

export const elapsed = writable("")

export const input = writable("")

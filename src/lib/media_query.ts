export type Size = {
    width: number,
    height: number,
}

export enum Orientation {
    Portrait,
    Landscape,
}

export default class MediaQuery {
    private window: Window

    private constructor (window: Window) {
        this.window = window
    }

    static of = (window: Window) => new MediaQuery(window)

    get width(): number { return this.window.innerWidth }

    get height(): number { return this.window.innerHeight }

    get size(): Size { return { width: this.width, height: this.height } }

    get orientation(): Orientation {
        return (this.width > this.height) ? Orientation.Landscape : Orientation.Portrait
    }
}

MediaQuery.of(window)

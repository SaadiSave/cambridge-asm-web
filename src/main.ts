import "./app.css"
import App from "./App.svelte"
import polyfill from "./lib/polyfill"

polyfill().catch(e => console.error(e))

const app = new App({
    target: document.getElementById("app") ?? document,
})

export default app

// @ts-ignore
declare const self: ServiceWorkerGlobalScope

const addToCache = async (resources: string[]) => {
    const cache = await caches.open("v1")
    await cache.addAll(resources)
}

self.addEventListener("install", (evt: ExtendableEvent) => {
    const rsrc = [
        "/",
        "/cambridge_asm_web.js",
        "/cambridge_asm_web_bg.wasm",
        "/module-workers-polyfill-0.3.2.min.js",
        "/index.js",
        "/index.html",
        "/index.css",
        "/worker.js",
    ]
    evt.waitUntil(addToCache(rsrc))
})

self.addEventListener("fetch", async (evt: FetchEvent) => {
    const { request } = evt
    const match = await caches.match(request)
    if (match) {
        evt.respondWith(match)
    } else {
        const resp = await fetch(request)
        const cache = await caches.open("v1")
        await cache.put(request, resp.clone())
        evt.respondWith(resp)
    }
})


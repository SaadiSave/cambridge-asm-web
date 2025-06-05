export function waitUntil(conditionFn: () => boolean, interval = 100, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now()

        const checkCondition = () => {
            if (conditionFn()) {
                resolve(true)
            } else if (Date.now() - startTime >= timeout) {
                reject(new Error("Timeout waiting for condition"))
            } else {
                setTimeout(checkCondition, interval)
            }
        }

        checkCondition()
    })
}

import type { Config } from "tailwindcss"

export default {
    content: ["./src/**/*.{html,js,svelte,ts}"],

    theme: {
        fontFamily: {
            sans: [
                "Merriweather Sans",
                "ui-sans-serif",
                "system-ui",
                "sans-serif",
                "Apple Color Emoji",
                "Segoe UI Emoji",
                "Segoe UI Symbol",
                "Noto Color Emoji",
            ],
            serif: [
                "Merriweather",
                "ui-serif",
                "Georgia",
                "Cambria",
                "Times New Roman",
                "Times",
                "serif",
            ],
            mono: [
                "JetBrains Mono",
                "ui-monospace",
                "SFMono-Regular",
                "Menlo",
                "Monaco",
                "Consolas",
                "Liberation Mono",
                "Courier New",
                "monospace",
            ],
        },
    },

    plugins: [],
} satisfies Config

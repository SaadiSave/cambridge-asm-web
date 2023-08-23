scripts_dir := "scripts"
tauri_dir := "src-tauri"

wasm:
    sh {{scripts_dir}}/build_wasm.sh 1

wasm-prod:
    sh {{scripts_dir}}/build_wasm.sh 3 --release

tauri:
    cd {{tauri_dir}} && cargo tauri dev

tauri-build:
    cd {{tauri_dir}} && cargo tauri build

vite:
    npm run dev

web:
    just wasm-prod
    npm run build

check:
    npm run check
    cd wasm && cargo check

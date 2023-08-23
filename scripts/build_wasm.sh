#!/bin/env sh

OPT_LEVEL="$1"
shift 1
REST="$@"

cd ./wasm
RUSTFLAGS="-Copt-level=$OPT_LEVEL" wasm-pack build --target web $REST

cd ..
rm -r src/lib/wasm
mv wasm/pkg src/lib/wasm

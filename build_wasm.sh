#!/bin/env sh

# UNSANITISED CLI ARGUMENTS; DO NOT USE OUTSIDE TRUSTED ENVIRONMENTS

RUSTFLAGS="-Copt-level=$1" wasm-pack build --target web --release

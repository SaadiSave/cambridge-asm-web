#!/bin/env sh

# UNSANITISED CLI ARGUMENTS; DO NOT USE OUTSIDE TRUSTED ENVIRONMENTS

if [ -n "$1" ]; then
  sh build_wasm.sh "$1" && cp -r ./pkg/* ./web && rm web/package.json
fi

tsc -p .
sass ./web/index.scss ./web/index.css
cp ./web/sw/sw.js ./web/sw.js

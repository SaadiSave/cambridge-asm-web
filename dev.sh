#!/bin/env sh

# UNSANITISED CLI ARGUMENTS; DO NOT USE OUTSIDE TRUSTED ENVIRONMENTS

if [ -n "$1" ]; then
	sh build_wasm.sh "$1" && cp -r ./pkg/* ./web && rm web/package.json
fi

tsc -p .
sass ./web/index.scss ./web/index.css
curl --request GET -sL \
	--url 'https://unpkg.com/module-workers-polyfill@0.3.2/module-workers-polyfill.min.js' \
	--output './web/module-workers-polyfill-0.3.2.min.js'

#!/bin/env sh

# clean
rm -r prod

# output dir
mkdir prod
mkdir prod/web
mkdir prod/pkg

# build
sh build_wasm.sh 3 &
tsc -p . &
sass ./web/index.scss ./web/index.css

pstree $$

wait

# minify
FILES="web/index.js
web/worker.js
web/index.html
web/index.css
pkg/cambridge_asm_web.js"

for f in ${FILES}; do
	minify "${f}" >"prod/${f}" &
done

pstree $$

wait

mv prod/web/* prod/ &
mv prod/pkg/* prod/

rm -r prod/web prod/pkg

# copy WASM
cp "pkg/cambridge_asm_web_bg.wasm" "prod/cambridge_asm_web_bg.wasm"

# get polyfill
curl -L "https://unpkg.com/module-workers-polyfill@0.3.2/module-workers-polyfill.min.js" --output "prod/module-workers-polyfill.min.js"

# copy fonts
cp -r web/fonts prod/fonts

# check if everything exists in prod
CHECK="index.js
worker.js
index.html
index.css
cambridge_asm_web.js
module-workers-polyfill.min.js
cambridge_asm_web_bg.wasm
fonts"

cd prod || exit 1

for f in ${CHECK}; do
	if stat "${f}" >/dev/null; then
		echo "${f} exists."
	else
		exit 1
	fi
done

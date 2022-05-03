#!/bin/env python3

from sys import version_info

assert version_info.major == 3
assert version_info.minor >= 9

from threading import Thread
from os import mkdir
from shutil import copyfile
from subprocess import run


def build():
    cmds: list[tuple[str, list[str]]] = [
        ("sh", ["build_wasm.sh", "3"]),
        ("tsc", ["-p", "."]),
        ("sass", ["./web/index.scss", "./web/index.css"]),
    ]

    def spawn(cmd: str, args: list[str]):
        try:
            run([cmd] + args, capture_output=True)
        except FileNotFoundError:
            print(f"command '{cmd}' not found")

    threads = [Thread(target=spawn, args=proc) for proc in cmds]

    for t in threads:
        t.start()
    for t in threads:
        t.join()


def minify():
    try:
        mkdir("prod")
    except FileExistsError:
        pass

    files = [
        "web/index.js",
        "web/worker.js",
        "web/index.html",
        "web/index.css",
        "web/sw/sw.js",
        "pkg/cambridge_asm_web.js",
    ]

    def minifier(path: str):
        minfied = run(["minify", path], capture_output=True).stdout

        file = path.split("/").pop()

        with open(f"prod/{file}", "wb") as f:
            f.write(minfied)

    threads = [Thread(target=minifier, args=(file,)) for file in files]

    for t in threads:
        t.start()
    for t in threads:
        t.join()


def other_files():
    try:
        mkdir("prod")
    except FileExistsError:
        pass

    copyfile("pkg/cambridge_asm_web_bg.wasm", "prod/cambridge_asm_web_bg.wasm")

    from urllib.request import urlopen

    with urlopen(
        "https://unpkg.com/module-workers-polyfill@0.3.2/module-workers-polyfill.min.js"
    ) as response, open("prod/module-workers-polyfill.min.js", "wb") as f:
        f.write(response.read())


def main():
    build()
    other_files()
    minify()


if __name__ == "__main__":
    main()

#!/bin/env python3

from threading import Thread
from os import system


def main():
    tsc = Thread(target=system, args=("tsc -p . --watch",))
    sass = Thread(target=system, args=("sass -w web/index.scss web/index.css",))

    for t in [tsc, sass]:
        t.start()
    for t in [tsc, sass]:
        t.join()


if __name__ == "__main__":
    main()

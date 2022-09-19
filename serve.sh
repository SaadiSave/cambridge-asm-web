#!/bin/env sh

# UNSANITISED CLI ARGUMENTS; DO NOT USE OUTSIDE TRUSTED ENVIRONMENTS

if [ "$1" = "prod" ]; then
	DIR="prod"
else
	DIR="web"
fi

if [ -n "$2" ]; then
	PORT="$2"
else
	PORT="8000"
fi

cd "${DIR}" && python3 -m http.server "${PORT}"

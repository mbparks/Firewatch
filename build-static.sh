#!/usr/bin/env sh
set -eu
npm install
npm run build
printf "\nFIREWATCH static deployment is ready in: %s/dist/\n" "$(pwd)"
printf "Upload the CONTENTS of dist/ to your web-host directory.\n"

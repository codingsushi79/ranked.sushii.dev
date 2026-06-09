#!/usr/bin/env sh
set -e
cd "$(dirname "$0")/.."
mkdir -p public/downloads
find public/downloads -mindepth 1 -delete
DOCKER_BUILDKIT=1 docker build --platform linux/amd64 --target client-export -o type=local,dest=public/downloads .
find public/downloads -mindepth 1 ! -name 'ranked-cs2-client-setup.exe' -exec rm -rf {} + 2>/dev/null || true
echo "Wrote public/downloads/ranked-cs2-client-setup.exe"

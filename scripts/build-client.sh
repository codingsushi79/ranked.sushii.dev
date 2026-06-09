#!/usr/bin/env sh
set -e
cd "$(dirname "$0")/.."
mkdir -p public/downloads
find public/downloads -mindepth 1 -delete 2>/dev/null || true
cd client
npm ci
npm run build
if npm run electron:build; then
  if [ -f "../public/downloads/build/ranked-cs2-client-setup.exe" ]; then
    mv "../public/downloads/build/ranked-cs2-client-setup.exe" "../public/downloads/ranked-cs2-client-setup.exe"
  fi
  rm -rf "../public/downloads/build"
else
  echo "Electron build skipped or failed — UI + bridge compiled."
fi
# Keep only the portable installer (avoids Vercel 100 MB file limit)
find ../public/downloads -mindepth 1 ! -name 'ranked-cs2-client-setup.exe' -exec rm -rf {} + 2>/dev/null || true
echo "Client build finished."

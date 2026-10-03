#!/usr/bin/env bash
# Downloads a Google Font as ONE variable woff2 covering weights 300-900 (latin subset) → public/fonts/brand.woff2.
#   bash scripts/font.sh "Geist"        bash scripts/font.sh "Inter"
# Google serves static per-weight TTF to unknown browsers; the modern Chrome UA below gets the variable woff2,
# which the captions need for their light + bold mix.
set -euo pipefail
FAMILY=${1:?family name, e.g. Inter}
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"
CSS=$(curl -fsSL -A "$UA" "https://fonts.googleapis.com/css2?family=${FAMILY// /+}:wght@300..900&display=swap")
# the latin block is the last @font-face in the response
URL=$(echo "$CSS" | grep -o 'https://fonts.gstatic.com[^)]*\.woff2' | tail -1)
[ -n "$URL" ] || { echo "no woff2 for '$FAMILY' (static-only family?): try wght@400;700 or copy the site's own font file"; exit 1; }
mkdir -p public/fonts && curl -fsSL -o public/fonts/brand.woff2 "$URL"
echo "public/fonts/brand.woff2  ($FAMILY, $(stat -c %s public/fonts/brand.woff2) bytes) — set brand.ts font.family accordingly"

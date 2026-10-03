#!/usr/bin/env bash
# Render stills at the given seconds and tile them into one labelled contact sheet: out/sheet.png
#   bash scripts/stills.sh 1.5 4 8 12.3 ...
set -euo pipefail
mkdir -p out/stills
for t in "$@"; do
  npx remotion still Promo "out/stills/$t.jpg" --frame="$(python3 -c "print(round($t*60))")" --scale=0.4 --log=error
done
.venv/bin/python - "$@" <<'PY'
import sys
from PIL import Image, ImageDraw
ts = sys.argv[1:]
cols = 3; W, H = 640, 360
sheet = Image.new("RGB", (cols * W, ((len(ts) + cols - 1) // cols) * (H + 24)), (20, 20, 24))
for i, t in enumerate(ts):
    im = Image.open(f"out/stills/{t}.jpg").resize((W, H))
    x, y = (i % cols) * W, (i // cols) * (H + 24)
    sheet.paste(im, (x, y + 24)); ImageDraw.Draw(sheet).text((x + 8, y + 5), f"{t}s", fill=(255, 220, 0))
sheet.save("out/sheet.png"); print("out/sheet.png")
PY

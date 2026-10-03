"""Measure things on a captured page so overlays sit on real data.

  .venv/bin/python scripts/measure.py chart <page> <x> <y> <w> <h>
      For a line chart inside the card rect (CSS px, e.g. from rect(page, "card:^player count")):
      finds the line's colour (most frequent saturated colour), the plotting box it spans and its highest point.
      Prints  plot=[x, y, w, h]  peak=[x, y]  -> ChartReveal plot / peak.
"""
import sys
import numpy as np
from PIL import Image

cmd, page, *box = sys.argv[1:]
x0, y0, w, h = (float(v) for v in box)
im = np.asarray(Image.open(f"public/pages/{page}.jpg").convert("RGB")).astype(int)
S = 2  # pages are captured at 2x
crop = im[int(y0 * S):int((y0 + h) * S), int(x0 * S):int((x0 + w) * S)]
r, g, b = crop[..., 0], crop[..., 1], crop[..., 2]
mx, mn = crop.max(-1), crop.min(-1)
sat = (mx - mn) > 90  # saturated pixels: the series line, not text/grid
q = (crop[sat] // 16)
if not len(q):
    sys.exit("no saturated pixels in that rect — is it the chart card?")
vals, counts = np.unique(q[:, 0] * 256 + q[:, 1] * 16 + q[:, 2], return_counts=True)
top = vals[np.argmax(counts)]
target = np.array([top // 256, (top // 16) % 16, top % 16]) * 16 + 8
line = (np.abs(crop - target).sum(-1) < 90) & sat
ys, xs = np.nonzero(line)
i = int(np.argmin(ys))
plot = [x0 + xs.min() / S, y0 + ys.min() / S - 4, (xs.max() - xs.min()) / S, (ys.max() - ys.min()) / S + 8]
print(f"line colour ~ rgb{tuple(int(v) for v in target)}  ({len(xs)} px)")
print("plot=[%d, %d, %d, %d]" % tuple(round(v) for v in plot), " peak=[%d, %d]" % (round(x0 + xs[i] / S), round(y0 + ys[i] / S)))
print("note: plot covers the line's span; extend h down to the x-axis if the area fill should be wiped too")

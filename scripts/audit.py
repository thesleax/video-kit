"""Pace audit: how fast does the picture move? Run on the low-res proxy (npm run proxy).

  .venv/bin/python scripts/audit.py out/proxy.mp4

Prints the fastest half-second windows in full-resolution px per 60 fps frame (90th percentile optical flow).
Budget (docs/STYLE.md): <= 12 everywhere. Above that viewers read it as "too fast" - give the move more time,
less distance or less zoom change. Page-switch crossfades show up as short ~6-8 spikes; that's fine.
"""
import sys
import cv2
import numpy as np

cap = cv2.VideoCapture(sys.argv[1])
fps = cap.get(cv2.CAP_PROP_FPS) or 30
w = cap.get(cv2.CAP_PROP_FRAME_WIDTH)
k = (1920 / w) * (fps / 60)  # proxy px/frame -> full-res px per 1/60 s
prev, sp = None, []
while True:
    ok, fr = cap.read()
    if not ok:
        break
    g = cv2.cvtColor(fr, cv2.COLOR_BGR2GRAY).astype(np.float32)
    sp.append(0.0 if prev is None else float(np.percentile(np.linalg.norm(cv2.calcOpticalFlowFarneback(prev, g, None, 0.5, 3, 15, 3, 5, 1.2, 0), axis=2), 90)) * k)
    prev = g
sp = np.array(sp)
win = max(1, int(fps / 2))
rows = sorted(((i / fps, sp[i:i + win].mean()) for i in range(0, len(sp) - win, max(1, win // 2))), key=lambda r: -r[1])
print(f"median {np.median(sp):.1f} px/frame")
for t, v in rows[:15]:
    print(f"{t:7.2f}s  {v:5.1f}  {'TOO FAST' if v > 12 else ''}")

# QA — run before every full render and after it

| Check | How | Pass |
|---|---|---|
| Typecheck | `npm run typecheck` | no errors |
| Timeline | `npm run timeline` | no "overlap" warnings; speech ends before the outro music ends |
| Stills | ~30 `remotion still … --scale=0.4` across the timeline → one contact sheet | lifts aligned to the card edges; no cookie banners / skeletons; cursor never resting on a control it won't click; captions = what's being said; nothing cropped by the frame edge or the vignette |
| Clicks | for each `Tour` click: `href(page, query, i)` / rects.json `href` | opens exactly the `to` page |
| Pace | `npm run proxy` → `scripts/audit.py out/proxy.mp4` | every window ≤ 12 px/frame (short 6–8 spikes at page cross-fades are fine) |
| Mix | stems (`--props='{"stem":"music"}'` etc.) → `scripts/mixcheck.py` | every voice line ≥ 10 dB over music+sfx |
| Final loudness | `scripts/master.sh` prints it | I = -14 LUFS, true peak ≤ -1 dBFS, LRA ≲ 4 LU |
| Transcript | `whisper-cli -m ~/.cache/video-kit/whisper/ggml-base.en.bin -f final.wav` (16 kHz mono) | every line present, in order, at its time |

Typical failures and their cause:
- *A line missing in the transcript* → an effect's tail (impact/whoosh) under it, or the clip was leveled with
  loudnorm. Trim the effect, start the line after the hit, re-run tts for that line.
- *Lifted card shows a dark strip / off-by-pixels border* → rect was guessed; use `card:` / `css:` rects.
- *A card is visible before its lift time* → back-easing returns ~1e-16 at rest; the kit guards with
  `p < 0.001`, keep that guard in any custom animation that hides at 0.
- *Camera sweeps through the middle of a page at a page switch* → camera stops that jump at the switch frame;
  the Stage only smooths within a page — put the jump exactly on the switch frame (stop at `t+2`, new framing at `t+3`).
- *Render crawls* → a CSS blur/mask on a large image; use `_soft` pages.

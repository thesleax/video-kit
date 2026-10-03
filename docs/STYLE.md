# STYLE — the rules (each one is here because the user asked for it or rejected the alternative)

Reference look: high-end SaaS launch films (After Effects style) — the product's real UI in close-up, slightly
tilted in 3D, depth of field, a cursor using it, short section tabs, bold-light mixed captions, music-driven cuts.

## Picture

- **Close camera, real UI.** Pages fill the frame (zoom 1.2–2.0). The video background barely shows; when it does
  it is near-black neutral (the site's own background), never a coloured gradient. A blue radial "glow
  background" was rejected as unprofessional.
- **3D tilt is subtle:** rx 5–9°, ry −6…+8°, rz 0. Tilt changes slowly over a whole scene; quick tilt changes read as wobble.
- **One slow camera move per page.** Frame all click targets of a scene in one view and drift. Big jumps
  (header → card → chart within 2 s) were the #1 complaint ("too fast"). Budget: **≤ 12 px/frame** at 1080p60
  everywhere (`scripts/audit.py`). The Stage already averages the path over ±0.25 s and never across a page switch.
- **Motion blur** is automatic: Stage wraps itself in camera motion blur when the content moves > 7 px/frame.
  It reads as cinematic on the few fast moves; don't add it manually elsewhere.
- **Depth of field** = the `_soft` page variant cross-faded in (Stage `soft`) while a card is lifted. Never CSS blur.
- **No whip montages / flash cuts** of screenshots without interaction. Two fast "montage" sections were removed
  for being fast, repetitive and unexplained. Music-only stretches get a calm glide or a feature the voice
  introduced; everything shown should be either narrated or used by the cursor.
- **Intro / ending:** the logo mark alone, lit out of black (IconReveal), fade to black, the film fades in from
  black; at the end the mark returns animated and the film fades to black.

## Interaction honesty (the user calls violations "fake")

- **Every click is real:** its target rect comes from `rects.json`, and the page shown next is exactly what that
  link/tab opens (check the `href`). Example of a bug that happened: cursor clicked the first list card, video
  showed the *Trending* list (it was the 4th card).
- **Pointing hand only on a control that is about to be clicked.** No hovering with a hand over things that are
  never clicked. While waiting (typing etc.) the arrow rests in **empty space**, never on another button/chip.
- Cursor arrives ~0.2 s before the click, presses, a soft ripple shows, then it moves on (`tour()` does this).
  Cursor moves need ≥ 0.45 s; plan click times so they do (click on the first words of a sentence if needed).
- Overlays drawn on the UI must be things the product really does (a value ticking, a favourite star filling,
  a focus ring on a real input). Labels such as "Record · N" sit on the real data point (measure it off the
  screenshot), not somewhere convenient.
- macOS cursor (black arrow, white outline; white pointing hand), scaled with the zoom.

## Lifted cards

- Cut out the **exact card the site draws**: `card:<label>` query or a `css:` rect — never a guessed rect (a guess
  showed a dark strip and an off-by-4 px border, the user spotted it immediately).
- Lift = gentle rise + scale ~1.04 + soft shadow, ease-out cubic, ~0.5 s. **No glow ring, no outline, no
  overshoot (back-easing)** — those were called "unnecessary border and wobble".
- One lifted card at a time when stepping through rows.

## Type

- Captions are the voice line's own words appearing **as they are spoken** (`words()` from vo.json). Big text on
  screen that the voice doesn't say was called out ("text with no sound"). Section tabs (TopTab) name what the
  voice is presenting, 1–4 words.
- Caption style: light weight with the key words bold (`*word*`), 84–120 px, bottom-left over a dark gradient or
  centred over a softened page. Font = the product's own.
- Don't stack a caption on top of the page's own large headline (landing heroes): frame the camera so the
  headline sits above the caption band, use a TopTab instead, or let the page's headline be the text.
- The caption font must be a **variable** font (300–900) or the light/bold mix collapses into all-bold:
  `bash scripts/font.sh "<Google family>"`, or copy the site's own variable woff2.
- TopTab: hangs from the top edge, dark glass, rounded bottom corners.

## Sound

- Voice is king: every line ≥ 10 dB above music + effects (`scripts/mixcheck.py`). Music ducks ~10 dB under the
  voice with short ramps; effects drop 60 % under the voice.
- All voice lines leveled to the same -16 dBFS RMS by measured gain (never `loudnorm` per clip: short clips come
  out 15–20 dB quiet — three lines went missing under the music once).
- Impacts / whooshes are long-tailed: trim them (4th SFX field) or start the line after the hit.
- Master: two-pass **linear** loudnorm to -14 LUFS (`scripts/master.sh`) — one fixed gain, LRA stays ~2 LU,
  no "sometimes quiet" voice.
- SFX are modern UI sounds (docs/SOUND.md); the old library's cartoonish ones were called "old-fashioned".

## Music sync

- Scene starts on bars; the logo on the first big hit; the feature tour on drop 1; question + typing in the
  breakdown; the hero feature's reveal **exactly on drop 2** (the click lands on the drop); outro on the music's own
  outro, which may mean cutting whole phrases out of the middle (docs/MUSIC.md).

# PLAYBOOK — make the promo video for the project this kit was cloned into

You (the agent) are reading this because the user cloned this repo into one of their projects, usually as
`<project>/video/`, and asked for a video. Follow the steps in order. The result is a ~60–100 s, 1080p60
product video: a camera gliding over the product's **real** UI, a macOS cursor really using it, a
voice-over with word-synced captions, licensed music with scenes cut on its beats, and modern UI sound effects.

The method was proven on a real product launch; every rule in `docs/STYLE.md` is there because the user rejected
the alternative. Read `docs/STYLE.md` before step 6. The other docs are referenced where they apply.

**Never edit the host project.** Everything lives in this folder. The host is only read (step 2) and filmed
(step 5). Work in this folder as cwd; `..` is the host project.

---

## 0 · What you have

| Path | What |
|---|---|
| `setup.sh` | one-time install on a fresh Ubuntu/Debian machine |
| `video.config.json` | site URL + pages to film (from `video.config.example.json`) |
| `src/kit/` | camera Stage, Cursor, Lift, Num, Say, TopTab … (product-agnostic, don't fork per project) |
| `src/recipes/` | ready scenes: IconReveal, LogoReveal, Glide, Spoken, Tour, Counters, Typing, Toasts, Outro |
| `src/project/` | **the only per-project code**: `brand.ts`, `script.txt`, `timeline.ts`, `scenes.tsx` (+ generated `rects.json`, `vo.json`) |
| `src/Promo.tsx` | engine: plays the timeline, ducks music under voice, stems for checks |
| `scripts/` | detect, capture, pages, tts, music, dump-timeline, audit, mixcheck, master, fetch-sfx |
| `docs/` | STYLE (rules), SCENES (recipe catalog), VOICE, MUSIC, SOUND, QA |

## 1 · Setup (once per machine)

```bash
bash setup.sh          # ffmpeg, Node 22, Remotion, Playwright+Chromium, Python venv, Kokoro, whisper.cpp, SFX
```
Check: `node -v` ≥ 20, `ffmpeg -version`, `whisper-cli -h`, `ls public/sfx | wc -l` = 22 (21 effects + CREDITS),
`.venv/bin/python -c "import kokoro_onnx, librosa, cv2"`. Machines without a GPU are fine (see "Render time").

## 2 · Understand the product

```bash
npm run detect          # framework, run command, live URL hints, color tokens, fonts, logo files, routes
```
Then actually learn the product, the way a new teammate would:
- Read the host `README*`, landing/home page source, i18n strings (they describe features in plain words), docs/about/FAQ pages.
- List **every user-facing feature**, ranked by what a newcomer cares about. Note the one "hero" feature (the most
  impressive, interactive one: search, AI, editor, dashboard…) — it goes on the music's biggest drop.
- Decide what to film: the **live URL** if the site is deployed (most reliable: real data, real images), otherwise
  run the host's dev server (`npm run dev` etc. from detect) in the background and use `http://localhost:<port>`.
  The kit never cares about the framework (Next, Nuxt, Astro, Vue, React, Svelte, Angular, Laravel, Django …):
  it films whatever a browser shows. Pages behind login: use a demo account's session (`cookies` / `localStorage`
  in the config) — never a real user's.
- Open pages in Playwright (or `curl`) and check images load from the URL you'll film. A dev server may not serve
  proxied images (we hit this once: localhost lacked an image proxy, the live site had it).

Fill `src/project/brand.ts`:
- `colors`: the site's **dark theme** tokens from detect (background, card, primary, foreground, muted fg, border).
  If the site has no dark theme, film light (`colorScheme: "light"` in the config) and use the light tokens;
  keep the video's own background near-black either way (see STYLE).
- `font`: copy the site's own woff2 (from `@fontsource*/files`, the public folder, or download the Google Font) to
  `public/fonts/brand.woff2`; set `family`.
- `logo`: the square logo mark (favicon.svg is often perfect) → `public/brand/logo.svg`. `tilt` -12 looks good
  for square marks; 0 for round/wordmark-only logos.
- `name`, `url`.

## 3 · Agree on the basics with the user (one short message)

Ask only what you can't decide: **language** (default English for reach), **length** (default: fit the track,
60–100 s), and **music**. Offer the tracks in `docs/MUSIC.md` with links (house artist: Alex_MakeMusic on
Pixabay). Pixabay blocks server downloads, so the user downloads the MP3 and drops it into
`video/public/music/track.mp3`. Voice: default `af_heart` (see `docs/VOICE.md`); offer samples
(`.venv/bin/python scripts/tts.py voices` after writing line 01) only if they want to choose.

## 4 · Script and voice

Write `src/project/script.txt` (`id|text` per line) using the structure in `docs/VOICE.md`:
hook question → "Meet NAME." → one line per feature (in tour order) → the question that sets up the hero feature
→ hero line → extras → "And that's just the beginning." → outro with the URL spelled for speech ("acme dot com").
Rules: short sentences, numbers the site really shows (read them off the live page), no claims the product doesn't
make. Total speech ≈ 65–70 % of the video; the rest is music.

```bash
.venv/bin/python scripts/tts.py            # → public/vo/*.wav (all at -16 dBFS), src/project/vo.json (word times)
```
Show the user the script (and a listening link if you can publish one) before building scenes.

## 5 · Music + film the product

```bash
.venv/bin/python scripts/music.py analyze public/music/track.mp3
```
Map the structure (docs/MUSIC.md): intro → first hit (logo) → drop 1 (feature tour) → breakdown (the question,
typing) → drop 2 (hero reveal) → outro (logo + URL). If the track is longer than the story, remove whole
8-bar phrases from inside a drop: `scripts/music.py cut public/music/track.mp3 A B` (pick A/B from its
"best phrase cuts", similarity ≥ 0.99). The engine plays `public/music/edit.wav`.

Write `video.config.json` → `pages`: one entry per screen you will show **and one per state a click produces**
(a tab, a filter, a search result — use `click` or the URL that click opens). Give each page the `queries` for
everything the cursor will click or a lift will cut out (see the query forms in `scripts/capture.mjs`;
`card:<label>` gets the exact card around a label, `css:` lists return the real `href` of each link).

```bash
npm run capture                 # → public/pages/*.jpg (+ _soft), src/project/rects.json
ONLY=pricing npm run capture    # re-shoot one page
```
Look at every captured page (make a contact sheet) — cookie banners, chat bubbles, empty lazy sections,
skeleton loaders. Fix with `hideSelectors` / `hideFixedText` / `waitFor`, re-shoot.
**For every planned click, check `rects.json` → its `href` opens exactly the page you show next.**

## 6 · Build the video

Read `docs/STYLE.md` and `docs/SCENES.md` first. Then:
1. `src/project/timeline.ts`: scenes with start times **on the music's bars/drops** (from analyze), each voice line
   attached to the scene it narrates (`vo`, `voAt` offset), `EXTRA_VO` for "Meet NAME." landing on the logo hit,
   `END`, `SFX` (docs/SOUND.md has the placement table). `npm run timeline` warns about overlapping lines.
2. `src/project/scenes.tsx`: one component per scene id, built from recipes. Rects only via
   `rect(page, query, i)`; caption words only via `words(lineId, bold, from, to)` — never typed by hand.
3. Preview frames as you go: `npx remotion still Promo out/s.jpg --frame=<n> --scale=0.4` (a contact sheet of
   ~30 stills across the timeline catches most problems). `npm run studio` also works if you can open a browser.

## 7 · Check (all four, every time; details in docs/QA.md)

```bash
npm run proxy && .venv/bin/python scripts/audit.py out/proxy.mp4        # pace: every window ≤ 12 px/frame
npm run timeline && for s in music vo sfx; do npx remotion render Promo out/stem_$s.wav --codec=wav --props="{\"stem\":\"$s\"}"; done \
  && .venv/bin/python scripts/mixcheck.py                                  # every line ≥ 10 dB over the bed
```
Plus: stills contact sheet (lifts aligned, no stray overlays, cursor never resting on a control it won't click)
and, after the render, a whisper transcript of the final audio (every line present, in order).

## 8 · Render and deliver

```bash
npm run render && npm run master        # out/final.mp4 (-14 LUFS, linear) + out/final_720p.mp4
```
Copy `out/final.mp4` to where the user wants it, give them a preview (publish the 720p file if you can), list
what's in it and the credits (music: artist + Pixabay link; SFX: Mixkit; voice: Kokoro af_heart).

## Render time and fast iteration

No GPU: ~0.5 s per 1080p60 frame → a 95 s video ≈ 45–60 min. So:
- audio-only fixes: re-render audio (`--codec=wav`) and mux onto the existing video (`ffmpeg -i raw.mp4 -i a.wav -map 0:v -map 1:a -c:v copy …`) — minutes, not an hour.
- check with stills and the quarter-res proxy; render full only when those are clean.
- never use CSS `filter: blur` / masks on big screenshots (one CPU core composites them — renders crawl);
  use the `_soft` page variants (Stage `soft`) instead.

## Iterating with the user

They watch the 720p preview and send notes. Map each note to a rule in STYLE.md (pace, fake clicks, borders,
audio balance …), fix the cause (not just the frame they saw), re-run the checks, re-render. Add any new rule
they teach you to `docs/STYLE.md` so the next project starts with it.

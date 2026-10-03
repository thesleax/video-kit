---
name: promo-video
description: Make a polished, animated promo / launch / demo video of the user's web product — the product's real UI filmed in close-up with a 3D camera, a macOS cursor really clicking through it, word-synced voice-over captions, licensed music with scenes cut on its beats, and modern UI sound effects, rendered to 1080p60 MP4 with Remotion. Works for any web stack (Next.js, Nuxt, Astro, Vue, React, Svelte, Angular, Laravel, Django…) because it films the running site.
when_to_use: The user asks for a promo, launch, trailer, showcase, explainer or demo video of their app, website, SaaS, tool or project (in any language), or wants to turn their site into a marketing video.
argument-hint: "[notes: language, length, music, features to show]"
---

# Product promo video

You are making a ~60–100 s, 1080p60 product video of the project in the current working directory: a camera
gliding over the product's **real** UI, a macOS cursor really using it, a voice-over with word-synced captions,
licensed music with scenes cut on its beats, and modern UI sound effects. User notes: $ARGUMENTS

The method was proven on real product launches; every rule in `references/STYLE.md` exists because a user rejected
the alternative. Read it before step 6. The other references are pointed to where they apply:
[STYLE](references/STYLE.md) · [SCENES](references/SCENES.md) · [VOICE](references/VOICE.md) ·
[MUSIC](references/MUSIC.md) · [SOUND](references/SOUND.md) · [QA](references/QA.md)

**Never edit the host project.** All work happens in a `video/` folder created next to it. The host is only read
(step 2) and filmed (step 5). If its own instructions (CLAUDE.md / AGENTS.md) forbid running it on this machine,
film the deployed site instead.

## 0 · Create the video workspace

From the project root:
```bash
[ -d video ] || cp -r "${CLAUDE_SKILL_DIR}/template" video   # the Remotion engine, recipes and tools
cd video                                                        # every later command runs here; .. is the host
```
If `video/` already exists, this is a follow-up: read `video/src/project/` to see where the last session stopped.
The host repo should ignore `video/` (suggest adding it to the host's `.gitignore`, or committing it deliberately).

| Path (in `video/`) | What |
|---|---|
| `setup.sh` | one-time install on a fresh Ubuntu/Debian machine |
| `video.config.json` | site URL + pages to film (from `video.config.example.json`) |
| `src/kit/` | camera Stage, Cursor, Lift, Num, Say, TopTab … (product-agnostic) |
| `src/recipes/` | ready scenes: IconReveal, LogoReveal, Glide, Spoken, Caption, Tour, Counters, Typing, ChartReveal, LiveLine, Toggle, Toasts, Outro |
| `src/project/` | **the only per-project code**: `brand.ts`, `script.txt`, `timeline.ts`, `scenes.tsx` (+ generated `rects.json`, `vo.json`) |
| `src/Promo.tsx` | engine: plays the timeline, ducks music under voice, stems for checks |
| `scripts/` | detect, capture, pages, font, tts, music, measure, stills, dump-timeline, audit, mixcheck, master, fetch-sfx |

## 1 · Setup (once per machine)

```bash
bash setup.sh          # ffmpeg, Node 22, Remotion, Playwright+Chromium, Python venv, Kokoro, whisper.cpp, SFX
```
Check: `node -v` ≥ 20, `ffmpeg -version`, `whisper-cli -h`, `ls public/sfx | wc -l` = 22 (21 effects + CREDITS),
`.venv/bin/python -c "import kokoro_onnx, librosa, cv2"`. Machines without a GPU are fine (see "Render time").

## 2 · Understand the product

```bash
npm run detect          # framework, run command, live URL hints, color tokens (as hex), fonts, logo files, routes
```
If the web app lives in a subfolder (monorepo: `frontend/`, `apps/web/`…), run `node scripts/detect.mjs ../frontend`.
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
  When detect finds none (colours in Tailwind classes / JS), capture first and read them off the screenshots:
  `.venv/bin/python scripts/measure.py color <page> <rect of the primary button / a card / the page>`.
  If the site has no dark theme, film light (`colorScheme: "light"` in the config) and use the light tokens;
  keep the video's own background near-black either way (see STYLE).
- `font`: a **variable** woff2 of the site's font → `public/fonts/brand.woff2`; set `family`. Google Fonts
  (incl. `next/font/google`): `bash scripts/font.sh "Inter"`. Otherwise copy it from `@fontsource-variable/*/files`
  or the public folder.
- Routes with `[locale]`: film under the locale prefix the live site uses (`/en/…`); detect prints a note. Some
  sites pick the language from the browser instead (`/en` redirects to `/`): capture prints each page's final URL —
  check it, set `"locale"` in the config, and make sure the **content** you'll show is in the video's language
  (a blog or a list may mix languages: lift an item in the right one).
- `logo`: the square logo mark (favicon.svg is often perfect) → `mkdir -p public/brand && cp … public/brand/logo.svg`
  (PNG works too; set `file` accordingly). `tilt` -12 looks good
  for square marks; 0 for round/wordmark-only logos.
- `name`, `url`.

## 3 · Agree on the basics with the user (one short message)

Ask only what you can't decide: **language** (default English for reach), **length** (default: fit the track,
60–100 s), and **music**. Offer the tracks in `references/MUSIC.md` with links (house artist: Alex_MakeMusic on
Pixabay). Pixabay blocks server downloads, so the user downloads the MP3 and drops it into
`video/public/music/track.mp3` (`mkdir -p public/music` if setup hasn't created it). Voice: default `af_heart` (see `references/VOICE.md`); offer samples
(`.venv/bin/python scripts/tts.py voices` after writing line 01) only if they want to choose.

## 4 · Script and voice

Write `src/project/script.txt` (`id|text` per line) using the structure in `references/VOICE.md`:
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
Map the structure (references/MUSIC.md): intro → first hit (logo) → drop 1 (feature tour) → breakdown (the question,
typing) → drop 2 (hero reveal) → outro (logo + URL). If the track is longer than the story, remove whole
8-bar phrases from inside a drop: `scripts/music.py cut public/music/track.mp3 A B` (pick A/B from its
"best phrase cuts", similarity ≥ 0.99), or jump from the end of your story straight to the music's pre-outro bar.
**A and B must both be bar starts from analyze's bar list** — a cut that lands mid-bar shifts the beat. Size the
cut to the speech: no music-only gap longer than ~3 s before the outro. The engine plays `public/music/edit.wav`.

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

Read `references/STYLE.md` and `references/SCENES.md` first. Then:
1. `src/project/timeline.ts`: scenes with start times **on the music's bars/drops** (from analyze), each voice line
   attached to the scene it narrates (`vo`, `voAt` offset), `EXTRA_VO` for "Meet NAME." landing on the logo hit,
   `END`, `SFX` (references/SOUND.md has the placement table). `npm run timeline` warns about overlapping lines.
2. `src/project/scenes.tsx`: one component per scene id, built from recipes. Rects only via
   `rect(page, query, i)`; caption words only via `words(lineId, bold, from, to)` — never typed by hand.
3. Measure real data you overlay: `scripts/measure.py chart <page> x y w h` gives a chart's plot box and peak.
4. Preview as you go: `bash scripts/stills.sh 1.5 4 8 …` renders stills at those seconds into one labelled
   `out/sheet.png` — look at it after every change; ~30 points across the timeline catch most problems.
   `npm run studio` also works if you can open a browser.

## 7 · Check (all four, every time; details in references/QA.md)

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

## What to expect

Following this skill gives a solid first cut that already respects every rule the reference film was polished
to. That film still took several rounds of the user's notes — expect one or two here too, and budget render time
for them. The recipes cover the reference film's scenes; a product with a very different hero interaction
(an editor, a map, a game canvas) may need one custom scene built from the kit (Stage, Lift, Num, Cursor, At).

## Iterating with the user

They watch the 720p preview and send notes. Map each note to a rule in STYLE.md (pace, fake clicks, borders,
audio balance …), fix the cause (not just the frame they saw), re-run the checks, re-render. Add any new rule
they teach you to `references/STYLE.md` (in this skill: `${CLAUDE_SKILL_DIR}/references/STYLE.md`) so the next project starts with it.

# STYLE — the craft rules (each one is here because a user asked for it or rejected the alternative)

These hold for every film. What changes per product — caption placement and type, section names, tilt amount,
transition kind, intro, backdrop tint, music, sound set — is the **look** (references/DIRECTION.md,
src/kit/looks.ts). Where a rule below names a specific treatment, it is the default of the `night` look.

## Picture

- **Close camera, real UI.** Pages fill the frame (zoom 1.2–2.0). The video background barely shows; when it does
  it is the site's own background with at most the look's faint brand glow. A strong coloured gradient
  background was rejected as unprofessional.
- **3D tilt is subtle:** scenes are written with rx 5–9°, ry −6…+8°, rz 0, and the look scales them (studio and
  editorial almost flat). Tilt changes slowly over a whole scene; quick tilt changes read as wobble.
- **One slow camera move per page.** Frame all click targets of a scene in one view and drift. Big jumps
  (header → card → chart within 2 s) were the #1 complaint ("too fast"). Budget: **≤ 12 px/frame** at 1080p60
  everywhere (`scripts/audit.py`). The Stage already averages the path over ±0.25 s and never across a page switch.
- **Motion blur** is automatic: Stage wraps itself in camera motion blur when the content moves > 7 px/frame.
  It reads as cinematic on the few fast moves; don't add it manually elsewhere.
- **Depth of field** = the `_soft` page variant cross-faded in (Stage `soft`) while a card is lifted. Never CSS blur.
- **No whip montages / flash cuts** of screenshots without interaction. Two fast "montage" sections were removed
  for being fast, repetitive and unexplained. Music-only stretches get a calm glide or a feature the voice
  introduced; everything shown should be either narrated or used by the cursor.
- **Intro / ending:** from black and back to black, with the product's mark (lit out of black, or the name typing
  in for wordmark looks); the user asked for this bookend explicitly.

## Coverage and depth

- **The film shows what the product is for.** If its value lives behind a login (dashboards, workspaces, editors),
  film it signed in with the user's own or a demo account — a film of only the public pages was rejected as shallow.
  Public detail pages (profiles, item pages) belong in it too when the product has them.
- **Depth over breadth:** a core feature gets its real interactions (open → switch tab / filter → data reacts →
  drill into a detail), not a single static frame. Secondary features can be one beat each.
- **Every system, not the first screen of it.** `scripts/features.py` lists every page, its sections and tabs. A
  product's deepest pages (a per-server analytics panel, a profile with eight tabs, a public item page with its
  own tabs) each get several shots: every tab that has data, its charts drawing, its tables filling. Rejected:
  a Stalkly cut that showed the dashboard home but not the per-server Command Center, the profile tabs or the
  public server page ("çok eksikler var… users/id, servers/id önemli tab yerleri").
- Ask the user what must be in and out; if they leave it to you, say what you chose.
- Need more time for the depth? Extend the track (repeat 8 bars of a drop) rather than dropping systems.
- Track it in `src/project/outline.md`; the coverage check in QA compares it to the scene list.

## Two films must not look alike

The user rejected a second product's film for looking like the first ("yine aynı temada olmuş… aynısı olmuş"): same
look, same track, same scene order. The look comes from the product and the track (direct.py, which also pushes
down what earlier films used); the scene list comes from this product's own systems; the user's own music is used
when they give one.

## Privacy in lists

Other people's names and avatars (top members, visitors, contacts, companions) are blurred at capture —
`blurPeople` keeps the numbers and bars readable, `blurCards` blurs a whole card. Account warnings ("your access
ends soon", unpaid invoices) stay out of frame.

## Interaction honesty (the user calls violations "fake")

- **Every click is real:** its target rect comes from `rects.json`, and the page shown next is exactly what that
  link/tab opens (check the `href`). Example of a bug that happened: cursor clicked the first list card, video
  showed the *Trending* list (it was the 4th card).
- **Pointing hand only on a control that is about to be clicked.** No hovering with a hand over things that are
  never clicked. While waiting (typing etc.) the arrow rests in **empty space**, never on another button/chip.
- **The control the cursor clicks is visible when it clicks.** Rejected: the typing overlay painted over a search
  button that sits inside the input, so the cursor clicked empty space. `Typing` now clears only up to the button and
  shows its enabled state (`filled`); check every click in stills.
- Cursor arrives ~0.2 s before the click, presses, a soft ripple shows, then it moves on (`tour()` does this).
  Cursor moves need ≥ 0.45 s; plan click times so they do (click on the first words of a sentence if needed).
- Overlays drawn on the UI must be things the product really does (a value ticking, a favourite star filling,
  a focus ring on a real input). Labels such as "Record · N" sit on the real data point (measure it off the
  screenshot), not somewhere convenient.
- macOS cursor (black arrow, white outline; white pointing hand), scaled with the zoom.

- **Content in the video's language.** Everything legible on screen — pages, lifted cards, list items — matches the
  voice-over's language. Sites that mix languages (a blog, user-generated lists) need you to pick items in the right
  one; an English video lifting a Turkish blog post was caught in review.

## Lifted cards

- Cut out the **exact card the site draws**: `card:<label>` query or a `css:` rect — never a guessed rect (a guess
  showed a dark strip and an off-by-4 px border, the user spotted it immediately).
- Lift = gentle rise + scale ~1.04 + soft shadow, ease-out cubic, ~0.5 s. **No glow ring, no outline, no
  overshoot (back-easing)** — those were called "unnecessary border and wobble".
- One lifted card at a time when stepping through rows.

## Type

- Captions are the voice line's own words appearing **as they are spoken** (`words()` from vo.json). Big text on
  screen that the voice doesn't say was called out ("text with no sound").
- **Caption density:** put the line on screen (`say` on Tour / Counters / ChartReveal, `Spoken`, `Caption`) when it
  carries the pitch — the hook, the core value, every number, the hero moment, the close — roughly 50–70 % of the
  lines. Lines that only narrate navigation ("click into the leaderboard") rely on the section label. A film with
  captions on only 3–4 lines read as too bare; captions on every single line read as a lyric video. Section tabs (TopTab) name what the
  voice is presenting, 1–4 words.
- Caption placement and type come from the look and never vary inside one film; accent words (`*word*`) are the
  ones that carry the sentence. Font = the product's own (or the look's display / mono face).
- Don't stack a caption on top of the page's own large headline (landing heroes): frame the camera so the
  headline sits above the caption band, use a TopTab instead, or let the page's headline be the text.
- The caption font must be a **variable** font (300–900) or the light/bold mix collapses into all-bold:
  `bash scripts/font.sh "<Google family>"`, or copy the site's own variable woff2.
- Section names (`Label`): tab, chapter number, corner tag or none — per the look; 1–4 words naming what's shown.

## Sound

- Voice is king: every line ≥ 10 dB above music + effects (`scripts/mixcheck.py`). Music ducks ~10 dB under the
  voice with short ramps; effects drop 60 % under the voice.
- All voice lines leveled to the same -16 dBFS RMS by measured gain (never `loudnorm` per clip: short clips come
  out 15–20 dB quiet — three lines went missing under the music once).
- Impacts / whooshes are long-tailed: trim them (4th SFX field) or start the line after the hit.
- Master: two-pass **linear** loudnorm to -14 LUFS (`scripts/master.sh`) — one fixed gain, LRA stays ~2 LU,
  no "sometimes quiet" voice.
- SFX are modern UI sounds (references/SOUND.md); the old library's cartoonish ones were called "old-fashioned".

## Music sync

- Scene starts on bars; the logo on the first big hit; the feature tour on drop 1; question + typing in the
  breakdown; the hero feature's reveal **exactly on drop 2** (the click lands on the drop); outro on the music's own
  outro, which may mean cutting whole phrases out of the middle (references/MUSIC.md).

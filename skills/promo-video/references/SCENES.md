# SCENES — recipe catalog

All recipes take `dur` (frames, passed by the engine) and times in **seconds from the scene start**.
Rects come from `rect(page, query, i)`; caption words from `words(lineId, bold?, from?, to?)`.
Camera stops are `[seconds, { fx, fy, z, rx, ry, rz }]`: `(fx, fy)` is the page point (CSS px) held at frame
centre, `z` the zoom (1 = page width 1440 px fills 1440 px of the 1920 frame).

Framing math: at zoom `z` the frame shows `1920/z × 1080/z` CSS px around `(fx, fy)`. Choose `z` so every
click target of the scene is inside, with margin — then the camera only needs to drift.

All recipes read `src/project/direction.ts` (the look): caption placement and type, `Label` style (tab / chapter /
corner / none), camera tilt and depth of field, scene transitions and the intro come from there, so the same scene
code fits any look. Pass `n` with `label` for numbered chapters.

## Placed `{ words, at, place?, size? }` / Label `{ text, at?, n? }`
Lower-level pieces the recipes use: words positioned per the look (or a forced `place`), and the section name.

## IconReveal
Opening / closing card from black: the mark lit out of black, or the name typing in (`intro: "wordmark"` looks).

## LogoReveal `{ page? }`
Logo + name over the softened home page; place it on the first big hit, with "Meet NAME." in `EXTRA_VO`
starting ~0.3 s earlier so the name lands on the hit.

## Glide `{ page, from, to }`
Calm establishing move (music-only bars). Children render inside the Stage (page coordinates).

## Spoken `{ page, words, at, size?, bottom?, cam? }`
The voice line as big type over a softened page. `bottom` = caption bottom-left over the page instead of centred.
Use for the hook, the hero question, "And that's just the beginning."

## Tour `{ page, cam, clicks, start?, rest?, lifts?, soft?, label? }` — the workhorse
```tsx
// "Top charts show you what's hot. Most played, most visited, best rated, and brand new."
charts: ({ dur }) => (
  <Tour dur={dur} page="charts" label="Top Charts"
    cam={[[0, { fx: 690, fy: 640, z: 1.6, rx: 8, ry: 4 }], [dur / 60, { fx: 760, fy: 660, z: 1.65, rx: 7, ry: -2 }]]}
    clicks={[
      { at: 2.94, r: rect("charts", "css:main a[href*='sort']", 1), to: "charts_visited" }, // href ?sort=visits
      { at: 3.76, r: rect("charts", "css:main a[href*='sort']", 3), to: "charts_rated" },
      { at: 4.58, r: rect("charts", "css:main a[href*='sort']", 4), to: "charts_newest" },
    ]}
    rest={[940, 640]} />
),
```
- click times = when the voice says the control's name (word times in `vo.json` + the scene's `voAt`).
- `to` = the captured page for the state that click produces; the switch cross-fades 4 frames after the press.
- `lifts: [{ r: rect("game", "card:^playing now"), at: 0.9, live: { r: rect("game", NUM, 0), base: 220798 } }]`
  lifts a card and keeps its number ticking (`NUM = "re:^[0-9]{1,3}(,[0-9]{3})+$"`).
- `lifts: [{ r: rect("game_about", "card:^second sea$"), at: 0.8, end: 1.1 }]` with
  `soft: [[0.7, 0], [0.9, 0.75], [1.1, 0.75], [1.3, 0]]` focuses on one card.
- Cursor starts near the first target (or `start`), ends at `rest`. Keep ≥ 0.45 s between a click and the next
  arrival — the arrival is 12 frames before each click.

## Counters `{ page, cam, nums: [{ r, to, at?, dur?, live? }] }`
Counts a value up when the voice says it (`at`), or ticks it live (no `at`) — `r` is the number's own rect
(`re:^[0-9]{1,3}(,[0-9]{3})+$` finds formatted numbers). The overlay covers the screenshot's value with the card
colour, so `brand.colors.card` must match the card behind the number.

## Caption `{ words, at, size?, centered? }`
The voice line as on-screen words layered over any scene (Tour, Stage) — bottom-left on a dark gradient, or centred.

## ChartReveal `{ page, plot, peak?, peakLabel?, drawFrom?, drawTo, labelAt?, cam, label?, bg? }`
A chart on the page draws itself, then a dot + label pop on its real peak. Get `plot` / `peak` from
`.venv/bin/python scripts/measure.py chart <page> <card rect>` (extend `plot` height down to the x-axis so the area
fill is wiped too). `peakLabel` must state the real value (read it off the page, e.g. the "Record" stat).

## LiveLine `{ page, top, bottom?, at }`
An illustrative line drawing itself point by point under centred spoken type — for "how it works" lines
("measured every single minute"). It shows a shape, not data: no numbers on it.

## Toggle `{ r, at, icon?: star|heart|bell|check, label?, bg? }`
Inside a Tour/Stage: from `at` (the click) the button shows its "on" state (filled icon + label, brand colour).
Pair with `clicks: [{ at, r }]` on the same rect and with Toasts for the notifications it enables.

## Typing `{ page, input, button, queries: [{ text, from, to }], focusAt, clickAt, cam }`
Types into the real input, can replace the text with a second query, clicks the real button at `clickAt` —
put that on the drop and start the next scene (the result page captured for the *last* query) on the drop.

## Toasts `{ items: [{ at, title, body }] }`
Notifications sliding in on the right, in screen px. Pair with a softened Stage behind (account features).

## Outro `{ at, words, urlAt }`
Logo + name, the tagline words as spoken, the URL pill when the URL is said.

---

## Patterns from the reference build (write these inline in `scenes.tsx` when a story needs them)

**Language switch** — film the footer language list as its own page (`tall` in the config), click the language,
cross-fade to the captured `/xx` home page.

**Mock panel (only when the real page can't be filmed, e.g. needs an account you don't have)** — build it with
`Card` in the site's exact colours/font, keep it obviously the same product, and still drive it with the real
cursor flow (type → click → success). Prefer a demo account over a mock.

## Anti-patterns (rejected before)
Whip-pan montages of random screenshots · camera hopping between distant points inside one sentence · lifted
card with glow ring or overshoot · guessed rects · cursor hand over things never clicked · captions that the voice
doesn't say · coloured gradient backgrounds · blur/mask CSS on big images.

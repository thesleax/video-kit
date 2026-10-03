# DIRECTION — the film's style comes from the product, not from a template

Two products should not get the same film. A Discord analytics tool, an invoicing app, a developer API and a
fashion shop differ in audience, tone and rhythm, and the film has to show it: where words sit, how sections are
named, how the camera moves, how scenes hand over, what the music and sounds feel like, and **which scenes exist**.

## 1 · Read the product (skill step 3)

```bash
.venv/bin/python scripts/direct.py ..        # after detect + a first capture; ../frontend in monorepos
```
It ranks the looks with reasons (category words in the copy, serif / mono / grotesk fonts, accent saturation,
light vs dark pages). Then decide like a director, using what you learned in step 2:
- **Who watches?** gamers / community admins (night, kinetic), teams and buyers (studio), developers (terminal),
  readers and creatives (editorial), consumers (kinetic).
- **What's the hero?** a live number, a search, an editor, a dashboard, a catalogue — pick the story shape below
  that puts it on the music's biggest moment.
- **What does the brand already say?** a serif wordmark leans editorial, a neon accent leans night/kinetic,
  a monochrome UI leans studio/terminal. The film should feel like the product's own marketing site, only moving.

Write the choice in `src/project/direction.ts` and tell the user in one line with the reason
("studio: it's a B2B invoicing tool with a muted palette — calm camera, chapter titles, corporate-electronic music").
Override any field the product calls for: `direct({ look: "studio", transition: "fade", caption: { position: "center" } })`.

## 2 · The looks (src/kit/looks.ts)

| Look | For | Captions | Section names | Camera / cuts | Intro | Music | SFX set |
|---|---|---|---|---|---|---|---|
| **night** | games, communities, creators, dark neon UIs | bottom-left, light + **bold** | hanging top tab | strong 3D tilt, DoF, blur-dip cuts | logo lit from black | future bass, energetic electronic | ui |
| **studio** | B2B, SaaS, finance, ops, analytics for teams | left editorial column | `01 — Title` chapters | near-flat camera, push cuts | name types in | modern corporate / calm electronic | soft |
| **editorial** | media, blogs, portfolios, serif brands | centred display type | small corner tag | slow, almost flat, wipe cuts | name types in | sparse piano / ambient pop | soft |
| **kinetic** | consumer, social, shops, youth | centred **UPPERCASE**, accent words in brand colour | none | strong tilt, zoom cuts | logo pop | bright dance / pop | playful |
| **terminal** | developer tools, APIs, infra, CLIs | mono lower-third with accent bar | corner tag | mild tilt, clean fades | name types in | minimal techno / techy electronic | tech |

Captions never move around inside one film: one placement, one type treatment, everywhere.

## 3 · Story shape per look (decides the scene list)

- **night** — hook question → name on the first hit → rapid tour of 4–6 features on drop 1 (one per 4–5 s) →
  question in the breakdown → hero interaction exactly on drop 2 → extras → "just the beginning" → outro.
- **studio** — the problem in one line → the product → 3–4 numbered chapters (one pillar each, 6–8 s, calmer cuts)
  → proof (real numbers: Counters / ChartReveal) → call to action. Fewer, longer scenes.
- **editorial** — a sentence-led film: 4–6 scenes, each one headline held for a full phrase, slow glides, no
  rapid clicking; the product's best page is the hero; end on the name and URL.
- **kinetic** — one word or short phrase per bar, big type over moving UI, 3 quick features, a loud CTA. Shortest
  (30–60 s), fastest cutting — but each move still within the pace budget (references/QA.md).
- **terminal** — the job it does in one line → the real UI / docs / code doing it (Typing into the real search or
  console, Tour through the dashboard) → speed or scale numbers → docs + CTA.

## 4 · Feature → scene (pick by what the product really has)

| The product has… | Scene |
|---|---|
| headline numbers on the site (users, servers, revenue…) | `Counters` (count up when spoken) or `Tour` lifting the stat cards |
| a chart of real data | `ChartReveal` with the measured peak |
| a list / leaderboard / catalogue | `Tour`: click into it, lift the top item, click an item → its detail page |
| search, AI prompt, command bar | `Typing` into the real input, click on a musical hit, result page next |
| tabs / filters / sort | `Tour` clicking each one (one captured page per state) |
| favourites, follow, subscribe, alerts | `Toggle` + `Toasts` |
| profiles / detail pages | `Tour` from the list (real link) + lift the info card |
| pricing | `Tour` on the pricing page, lift the plan / order card |
| blog, docs, languages | `Tour` + lift one item in the video's language |
| "how it works" with nothing visual | `LiveLine` / `Spoken` — keep it to one scene |

Don't film what isn't there; don't film the same kind of scene twice in a row; order scenes the way a visitor
discovers the product.

## 5 · Sound per look

| Set | Transitions | Clicks | Lifts / reveals | Hits | Notes |
|---|---|---|---|---|---|
| ui | sweep-small, whoosh-fast | click | light-pop | impact (trimmed) | the reference mix |
| soft | sweep-short only | click at 0.35 | dry-pop at 0.2 | none | quieter overall, no impacts |
| tech | tech-slide, scifi-sweep | select | option | impact-whoosh (trimmed) | crisp, digital |
| playful | swoosh-fast | mouse / click | bubble-pop, sparkle | impact | more frequent, still never on every word |
| cinematic | whoosh-fast | click | sparkle | impact, impact-whoosh, bass-pulse | trailers; use the music's hits |

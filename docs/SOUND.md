# SOUND EFFECTS

The set from the reference film, all from Mixkit (free for commercial use, no attribution; the license forbids
redistributing the files, so `scripts/fetch-sfx.sh` downloads them by id into `public/sfx/`).

| Name | Mixkit id | Sound | Where it goes | Volume |
|---|---|---|---|---|
| click | 2568 | cool interface click | every cursor click (tabs, links, buttons) | 0.5 |
| check | 1120 | modern checkbox tick | toggles, favourite/save | 0.45 |
| select | 3124 | modern technology select | values highlighting, counters landing | 0.3 |
| option | 2573 | interface option select | menus opening | 0.3 |
| mouse | 2997 | clear mouse clicks | double-click moments | 0.4 |
| light-pop | 3005 | light "explainer" pop | a card lifting out | 0.25–0.4 |
| dry-pop | 2356 | dry pop-up | small UI appearing | 0.35 |
| bubble-pop | 2357 | bubble pop-up alert | second toast | 0.45 |
| pop-alert | 2354 | message pop alert | first toast / notification | 0.4 |
| confirm | 2867 | confirmation tone | success states (saved, added, sent) | 0.4 |
| sweep-small | 166 | fast small sweep | scene transition (alternate with whoosh-fast) | 0.3 |
| whoosh-fast | 1490 | fast whoosh | scene transition, page jump | 0.25 |
| sweep-short | 175 | short sweep | soft transitions, intro fade, music break | 0.25–0.35 |
| swoosh-fast | 3115 | fast swoosh | quick whip (rarely needed now) | 0.4 |
| tech-slide | 3120 | technology slide | very first frame / tech reveal | 0.35 |
| scifi-sweep | 3114 | fast sci-fi sweep | futuristic features | 0.3 |
| impact | 2909 | cool cinematic impact | logo hit, outro — **trim to 1–1.2 s** | 0.2–0.25 |
| impact-whoosh | 2903 | whoosh + impact | the drop-2 reveal — **trim to 0.75 s** | 0.3 |
| sparkle | 2350 | magic sparkle whoosh | intro/end icon, a record/highlight pill | 0.3–0.35 |
| typing | 2531 | typing on a laptop | typing into inputs — **trim to the typing time** | 0.25–0.35 |
| bass-pulse | 2295 | pulsating bass | build-ups (optional) | 0.2 |

Volumes are what sounded right under the music bed in the reference mix; the engine additionally lowers every
effect by 60 % while the voice speaks. Long-tailed effects get a length (4th field in `SFX`) and fade over their
last 0.2 s automatically. Keep effects sparse: clicks, lifts, toasts, transitions, the two big hits — nothing on
every word.

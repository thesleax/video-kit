# Video Kit

A production kit for polished, animated product promo videos of any web project — Next.js, Nuxt, Astro, Vue,
React, Svelte, Angular, Laravel, Django… the framework doesn't matter. The video is filmed from the product's
**real interface**: the camera glides over its pages, a macOS cursor clicks real buttons, cards lift out, numbers
tick live; the voice-over arrives with word-synced captions, and scenes are cut on the music's beats.

## Install (Claude Code plugin)

```text
/plugin marketplace add thesleax/video-kit
/plugin install video-kit@video-kit
```
or from a shell: `claude plugin marketplace add thesleax/video-kit && claude plugin install video-kit@video-kit`.
Updates arrive through `/plugin` (marketplace → update).

Without the plugin system, copy the skill folder: `cp -r skills/promo-video ~/.claude/skills/` (it is
self-contained: instructions, references and the engine template).

## Usage

Open Claude Code in any project and ask for a video — the skill loads by itself:

> Make a promo video for this project.

or call it directly: `/video-kit:promo-video english, 90 seconds, show the dashboard and the AI search`.

Claude studies the project: framework, colours, font, logo, and an inventory of **every page and system** read from
the source (`scripts/features.py`: dashboards, per-item analytics panels, profile tabs, premium pages…). It asks you
what must be shown and what must stay out (or decides itself if you leave it to it), asks for a session cookie when
the important parts are behind a login, and reads **your music** (any track: tempo, sections, kicks, ending) and your
choice of voice. Then it writes the script, voices it, films the site, builds the scenes on the music's bars, runs
the checks and renders. First run on a machine installs the toolchain (~8 minutes, `video/setup.sh`).

## Styled for each product

The film's look is chosen per product **and per track** — not one template for everything. `scripts/direct.py` reads
the product (copy, fonts, colours, light/dark pages, audience), the music (tempo, punch) and your earlier films (so
two films don't look alike) and ranks six looks; Claude decides and explains why — or you name one:

| Look | For | Feel |
|---|---|---|
| night | games, communities, creators | bottom-left captions, hanging section tabs, strong 3D camera, energetic electronic |
| studio | B2B, SaaS, finance, teams | left editorial column, `01 —` chapters, calm camera, push cuts, corporate electronic |
| editorial | media, blogs, portfolios, serif brands | centred display type, wipes, slow and sparse |
| kinetic | consumer, social, shops | big centred uppercase words, zoom cuts, playful sounds |
| terminal | developer tools, APIs | mono lower-third captions, clean fades, tech sounds |
| pulse | any product on a fast, punchy track (phonk, jumpstyle, trap) | hard cuts on every bar, the frame hits on each kick, flash into drops, slammed uppercase captions |

The scene list follows the product's real features too (search → typing into the real input, charts → the real
chart drawing itself, lists → clicking into the real detail page…).

## What's inside

| | |
|---|---|
| **Picture** | Remotion (video in React), 1920×1080, 60 fps, automatic motion blur, depth of field |
| **Filming** | Playwright full-page screenshots of the site in dark mode + the real position and link target of every button and card |
| **Voice** | Kokoro TTS, `af_heart` voice (local, free, commercial use allowed) + word timings from whisper.cpp |
| **Music** | Alex_MakeMusic (Pixabay) — recommended tracks in `skills/promo-video/references/MUSIC.md`; beat/drop analysis and a cutting tool |
| **Sound effects** | The 21 Mixkit effects from the reference video (downloaded during setup) — `references/SOUND.md` |
| **Checks** | `doctor.py` (login bounces, fake clicks, tab clicks that hit a link, unvoiced lines, cuts off the bar, music map mismatch, privacy), QA stills that flag off-screen targets, pace audit (optical flow), voice-over-music ratio per line, -14 LUFS mastering |

## Layout

- `.claude-plugin/` — plugin manifest and the single-plugin marketplace
- `skills/promo-video/SKILL.md` — the step-by-step process Claude follows
- `skills/promo-video/references/` — STYLE (rules), SCENES (scene catalog), VOICE, MUSIC, SOUND, QA
- `skills/promo-video/template/` — the Remotion engine copied into each project as `video/`:
  `setup.sh`, `src/kit` + `src/recipes` (shared), `src/project` (per project), `scripts/` (tools)

## Requirements and timing

Ubuntu/Debian, 4+ cores, 8 GB RAM, ~3 GB disk. No GPU needed. A full render of a 1.5-minute video takes about
45–60 minutes on a GPU-less VDS; audio fixes take minutes.

## Licenses

Remotion: free for individuals and companies of up to 3 people (larger companies need a Remotion company license).
Kokoro: Apache-2.0. Music: Pixabay Content License. Sound effects: Mixkit license (the files are not kept in the
repo; they are downloaded during setup).

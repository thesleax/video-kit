# Video Kit

A production kit for polished, animated product promo videos of any web project — Next.js, Nuxt, Astro, Vue,
React, Svelte, Angular, Laravel, Django… the framework doesn't matter. The video is filmed from the product's
**real interface**: the camera glides over its pages, a macOS cursor clicks real buttons, cards lift out, numbers
tick live; the voice-over arrives with word-synced captions, and scenes are cut on the music's beats.

## Usage

```bash
cd my-project
git clone https://github.com/thesleax/video-kit video
```
Then tell Claude Code:

> Read video/PLAYBOOK.md and make a promo video for this project.

Claude studies the project (framework, pages, colours, font, logo), writes the script, generates the voice-over,
analyses the music, films the site, builds the scenes, runs the checks and renders the video. It only asks you to
download the music file (Pixabay doesn't allow server downloads) and to approve the script.

## What's inside

| | |
|---|---|
| **Picture** | Remotion (video in React), 1920×1080, 60 fps, automatic motion blur, depth of field |
| **Filming** | Playwright full-page screenshots of the site in dark mode + the real position and link target of every button and card |
| **Voice** | Kokoro TTS, `af_heart` voice (local, free, commercial use allowed) + word timings from whisper.cpp |
| **Music** | Alex_MakeMusic (Pixabay) — recommended tracks in `docs/MUSIC.md`; beat/drop analysis and a cutting tool |
| **Sound effects** | The 21 Mixkit effects from the reference video (downloaded during setup) — `docs/SOUND.md` |
| **Checks** | pace audit (optical flow), voice-over-music ratio per line, -14 LUFS mastering |

## Layout

- `PLAYBOOK.md` — the step-by-step process Claude follows
- `docs/` — STYLE (rules), SCENES (scene catalog), VOICE, MUSIC, SOUND, QA
- `setup.sh` — installs everything on a fresh Ubuntu/Debian server
- `src/kit`, `src/recipes` — shared components and ready-made scenes
- `src/project` — the per-project part (brand, script, timeline, scenes)
- `scripts/` — detection, capture, voice, music, audit and mastering tools

## Requirements and timing

Ubuntu/Debian, 4+ cores, 8 GB RAM, ~3 GB disk. No GPU needed. A full render of a 1.5-minute video takes about
45–60 minutes on a GPU-less VDS; audio fixes take minutes.

## Licenses

Remotion: free for individuals and companies of up to 3 people (larger companies need a Remotion company license).
Kokoro: Apache-2.0. Music: Pixabay Content License. Sound effects: Mixkit license (the files are not kept in the
repo; they are downloaded during setup).

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

Claude studies the project (framework, pages, colours, font, logo), creates a `video/` workspace next to it,
writes the script, generates the voice-over, analyses the music, films the site, builds the scenes, runs the checks
and renders the video. It only asks you to download the music file (Pixabay doesn't allow server downloads) and to
approve the script. First run on a machine installs the toolchain (~8 minutes, `video/setup.sh`).

## What's inside

| | |
|---|---|
| **Picture** | Remotion (video in React), 1920×1080, 60 fps, automatic motion blur, depth of field |
| **Filming** | Playwright full-page screenshots of the site in dark mode + the real position and link target of every button and card |
| **Voice** | Kokoro TTS, `af_heart` voice (local, free, commercial use allowed) + word timings from whisper.cpp |
| **Music** | Alex_MakeMusic (Pixabay) — recommended tracks in `skills/promo-video/references/MUSIC.md`; beat/drop analysis and a cutting tool |
| **Sound effects** | The 21 Mixkit effects from the reference video (downloaded during setup) — `references/SOUND.md` |
| **Checks** | pace audit (optical flow), voice-over-music ratio per line, -14 LUFS mastering |

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

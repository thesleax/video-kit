# VOICE

## Narrator: Kokoro `af_heart` (house voice)

Kokoro-82M (Apache-2.0, runs locally on CPU, free for commercial use). `af_heart` is a warm, natural American
female voice — chosen by the user from eight samples as closest to the reference film's narrator.
Speed **1.07** (slightly brisk, fits beat-cut scenes). Settings live in `video.config.json → tts`.

| Voice | Character | Use when |
|---|---|---|
| **af_heart** ★ | warm, natural, confident | default for everything |
| af_bella | brighter, energetic | consumer / games / hype |
| af_nicole | soft, close, almost whispered | calm, premium, wellness |
| af_sarah | calm, professional | B2B, finance, docs |
| af_nova | clear, neutral, modern | tech / dev tools |
| am_michael | male, warm | when a male voice is asked for |
| am_fenrir | male, deeper, punchier | gaming trailers |
| bf_emma / bm_george | British female / male | UK / EU audiences |

`.venv/bin/python scripts/tts.py voices` renders line 01 in all of them to `out/voices/` for the user to pick.
Kokoro is English-first (also es, fr, it, pt, hi, ja, zh voices with lower quality). For other languages or
a premium sound, ElevenLabs is the upgrade (paid API key) — don't clone a real person's voice.

## Script structure (≈150 words per minute; speech ≈ 65–70 % of the runtime)

| # | Line | Purpose | Scene |
|---|---|---|---|
| 01 | Hook question the product answers ("Ever wondered which … are really blowing up right now?") | curiosity | close glide over the most visual page |
| 02 | "Meet NAME." | name on the first musical hit | LogoReveal |
| 03 | The headline number(s) the site really shows ("Over 68,000 games tracked live…") | credibility | Counters |
| 04–08 | One line per core feature, in the order a visitor meets them; name the controls the cursor clicks ("Most played, most visited, best rated, and brand new.") | tour | Tour scenes |
| 09 | How it works / trust (freshness, data kept, privacy …) | depth | Spoken / custom visual |
| 10 | Short question that sets up the hero ("Don't know what to play?") | tension in the breakdown | Spoken |
| 11 | The hero interaction in the user's words ("Just describe it. A horror game to play with friends…") | demo | Typing |
| 12 | Payoff on drop 2 ("Our AI finds the games that match.") | wow | Tour + lifts |
| 13–15 | Secondary features (browse, account, notifications, adding content …) | breadth | Tour |
| 16 | Extras (blog, languages, integrations, mobile …) | breadth | Tour |
| 17 | "And that's just the beginning." | lands on the music break before the outro | Spoken |
| 18 | "NAME. <tagline>. Find … at name dot com." | close + URL | Outro |

Writing rules: one idea per sentence, ≤ 14 words; say UI names exactly as the site writes them (the caption and
the click must match); numbers rounded the way people say them ("over sixty-eight thousand"); spell domains for
speech ("rblxstat dot com"); no superlatives the product can't back.

## Pipeline notes

`scripts/tts.py` trims silence, levels every line to -16 dBFS RMS with a measured gain + limiter (not
`loudnorm`), and stores word timings (whisper.cpp) mapped back onto the script's own words → `vo.json`.
Re-voice single lines with `--only 07,12`. Timings in `vo.json` drive the captions; never hand-type them.

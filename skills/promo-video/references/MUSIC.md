# MUSIC

## House artist: Alex_MakeMusic (Pixabay)

Profile: https://pixabay.com/users/alex_makemusic-24186663/ — ~670 tracks, modern electronic / future bass /
upbeat pop, consistently produced, Pixabay Content License (free, commercial use, no attribution required).
The reference video used **"A Future Bass"** and the user loved it.

Same artist publishes on streaming as **7KEYS** ("Bear Down" album: *Everyday*, *El Dorados* …) via
DistroKid/Routenote. Those releases are registered for YouTube Content ID — **don't take the music from
YouTube/Spotify**; use the Pixabay download (the same producer's library) so the license is clean.

| Track | Length | Character | Link |
|---|---|---|---|
| **A Future Bass** ★ used in the reference | 1:54 | 86 BPM future bass: intro build, drop 1 ~12 s, breakdown ~41 s, drop 2 ~56 s, outro ~102 s | https://pixabay.com/music/future-bass-a-future-bass-484827/ |
| The Future Bass | 2:17 | newer future bass, bigger drops | https://pixabay.com/music/future-bass-the-future-bass-588056/ |
| Future Bass Music | 1:41 | short and dense — for 60 s cuts | https://pixabay.com/music/future-bass-future-bass-music-457273/ |
| Sport Silencer | 2:07 | future bass, sporty, energetic | https://pixabay.com/music/future-bass-sport-silencer-390360/ |
| Play Right (Instrumental) | 1:54 | electronic, techy — SaaS / dev tools | https://pixabay.com/music/electronic-play-right-instrumental-452249/ |
| Black Chrome (Instrumental) | 1:41 | darker, trap-leaning — gaming, security, crypto | https://pixabay.com/music/electronic-black-chrome-instrumental-450740/ |
| All In My Head | 2:09 | techno / trance drive | https://pixabay.com/music/techno-trance-all-in-my-head-385941/ |
| Energetic Modern Summer Dance Party | 1:41 | bright dance — consumer, social, lifestyle | https://pixabay.com/music/dance-energetic-modern-summer-dance-party-559304/ |
| Upbeat Motivational Corporate | 2:12 | calm-positive corporate — B2B, finance, docs | https://pixabay.com/music/corporate-upbeat-motivational-corporate-518966/ |

Pick by product mood: games/consumer → future bass; dev tools/SaaS → Play Right / The Future Bass; serious
B2B → Upbeat Motivational Corporate. Instrumental only (vocals fight the voice-over). Prefer 1:40–2:20 so
there's an intro, two drops and an outro to cut against.

**Download:** Pixabay returns 403 to servers. The user downloads the MP3 (Download button on the page) and puts
it in `video/public/music/track.mp3`. If they dislike every suggestion, ask what they disliked (too corporate?
too happy? too calm?) and search the artist's page with that in mind rather than guessing again.

## The user's own track

Any track the user gives (a phonk edit, a pop song, lo-fi …) works: `analyze` reads its tempo, sections, kicks and
ending, and the film is built on them (cuts on bars, the look's beat response on kicks, hero on drop 2). Mind the
license: a track from a streaming service is fine for a private preview; for a public upload the user must have
the rights (Content ID will claim it otherwise) — say so once, don't refuse.

## Reading the track

```bash
.venv/bin/python scripts/music.py analyze public/music/track.mp3
```
- **beat / bar**: scene starts go on bar lines (± 1 frame is fine).
- **drop candidates**: biggest energy jumps. The first big one after the intro = logo hit; the next = drop 1
  (feature tour starts); the one after the quiet stretch = drop 2 (hero reveal).
- **quiet stretches**: the breakdown — use it for the question ("Don't know what to …?") and the typing build-up.
- **best phrase cuts**: to shorten, remove whole 8-bar phrases from inside a drop, landing on the bar before the
  outro: `scripts/music.py cut public/music/track.mp3 A B` (30 ms crossfade, chroma similarity ≥ 0.99 = inaudible).

Reference build (A Future Bass, 94.7 s): intro icon 0–2.6 · hook 2.6 · logo on hit 7.15 · glide to drop 1 ·
drop 1 12.1: counters, charts, lists, game page, history chart, details · breakdown 41.7: "measured every
minute", question 46.7, typing 48.1 · **drop 2 55.87: Find clicked → results** · genres, account, add, blog ·
"just the beginning" on the pre-outro break · outro 82.7 · end card 90.4. Cut: 79.85 → 99.61.

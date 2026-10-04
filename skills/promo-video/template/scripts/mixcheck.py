"""Mix check: is every voice line clearly above music + effects?

  npm run timeline                      # writes public/timeline.json (voice starts) from src/project/timeline.ts
  for s in music vo sfx; do npx remotion render Promo out/stem_$s.wav --codec=wav --props="{\"stem\":\"$s\"}"; done
  .venv/bin/python scripts/mixcheck.py

Target: voice - (music + sfx) >= 10 dB on every line, measured in the SPEECH BAND (250 Hz - 5 kHz): that is what
masks words. Broadband is printed too, but bass-heavy tracks (phonk, trap, EDM) read low there while the words stay
clear. Low lines: an effect's tail under the speech (trim it, 4th SFX field), or a dense track — the engine plays the
carved bed under speech (MUSIC.bed from scripts/music.py); lower MUSIC.base before ducking deeper (deep ducks pump).
"""
import scipy.signal as ss
import json
import numpy as np
import soundfile as sf

tl = json.load(open("public/timeline.json"))
mono = lambda a: a.mean(1) if a.ndim > 1 else a
vo, sr = sf.read("out/stem_vo.wav"); mu, _ = sf.read("out/stem_music.wav"); fx, _ = sf.read("out/stem_sfx.wav")
vo, mu, fx = mono(vo), mono(mu), mono(fx)
n = min(len(vo), len(mu), len(fx)); vo, mu, fx = vo[:n], mu[:n], fx[:n]
db = lambda x: 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)
band = ss.butter(4, [250, 5000], btype="band", fs=sr, output="sos")
bvo, bbed = ss.sosfilt(band, vo), ss.sosfilt(band, mu + fx)
print("line   start   voice  music   sfx   broadband   speech band")
low = 0
for v in tl["vo"]:
    a, b = int(v["at"] * sr), int((v["at"] + v["dur"]) * sr)
    d = db(vo[a:b]) - db(mu[a:b] + fx[a:b])
    s_ = db(bvo[a:b]) - db(bbed[a:b])
    low += s_ < 10
    print(f"{v['id']:>4} {v['at']:7.2f}  {db(vo[a:b]):6.1f} {db(mu[a:b]):6.1f} {db(fx[a:b]):6.1f}   {d:7.1f}     {s_:7.1f} {'LOW' if s_ < 10 else ''}")
print(f"\n{low} line(s) under 10 dB in the speech band" if low else "\nevery line ≥ 10 dB over the bed in the speech band")

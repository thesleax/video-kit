"""Mix check: is every voice line clearly above music + effects?

  npm run timeline                      # writes public/timeline.json (voice starts) from src/project/timeline.ts
  for s in music vo sfx; do npx remotion render Promo out/stem_$s.wav --codec=wav --props="{\"stem\":\"$s\"}"; done
  .venv/bin/python scripts/mixcheck.py

Target: average voice - (music + sfx) >= 10 dB on every line. Low lines usually mean an effect's tail (impacts,
whooshes) runs under the speech: trim it (4th SFX field) or move the line off the hit.
"""
import json
import numpy as np
import soundfile as sf

tl = json.load(open("public/timeline.json"))
mono = lambda a: a.mean(1) if a.ndim > 1 else a
vo, sr = sf.read("out/stem_vo.wav"); mu, _ = sf.read("out/stem_music.wav"); fx, _ = sf.read("out/stem_sfx.wav")
vo, mu, fx = mono(vo), mono(mu), mono(fx)
n = min(len(vo), len(mu), len(fx)); vo, mu, fx = vo[:n], mu[:n], fx[:n]
db = lambda x: 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)
print("line   start   voice  music   sfx   voice-over-bed")
for v in tl["vo"]:
    a, b = int(v["at"] * sr), int((v["at"] + v["dur"]) * sr)
    d = db(vo[a:b]) - db(mu[a:b] + fx[a:b])
    print(f"{v['id']:>4} {v['at']:7.2f}  {db(vo[a:b]):6.1f} {db(mu[a:b]):6.1f} {db(fx[a:b]):6.1f}   {d:5.1f} {'LOW' if d < 10 else ''}")

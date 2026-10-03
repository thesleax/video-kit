"""Music: read the track's structure so scenes can sit on it, and cut it to length.

  .venv/bin/python scripts/music.py analyze public/music/track.mp3
      tempo, a steady beat grid, energy per bar (bar chart), drop candidates (big energy jumps),
      quiet stretches (breakdowns), and phrase-aligned cut suggestions with how similar both sides sound.
      Also writes out/music.json (beats, bars, energy) for planning.
  .venv/bin/python scripts/music.py cut public/music/track.mp3 A B [C D ...]
      keeps [0,A) + [B,C) + [D,end) ... with 30 ms crossfades -> public/music/edit.wav

How to use the numbers (see the skill's references/MUSIC.md): logo hit on the first big onset after the intro, feature tour on
drop 1, the "problem/question" beat in the breakdown, the hero feature exactly on drop 2, outro on the music's own
outro. Cut whole phrases (8 bars) from the middle of a drop when the video is shorter than the track.
"""
import json, os, subprocess, sys
import numpy as np
import librosa


def analyze(path):
    y, sr = librosa.load(path, sr=22050)
    dur = len(y) / sr
    tempo, beats = librosa.beat.beat_track(y=y, sr=sr, tightness=400, units="time")
    tempo = float(np.atleast_1d(tempo)[0])
    # downbeat phase: the beat of each bar with the most low-end (kick) energy
    hop = 256
    S = np.abs(librosa.stft(y, hop_length=hop))
    freqs = librosa.fft_frequencies(sr=sr)
    low = S[(freqs > 30) & (freqs < 150)].sum(0)
    bf = librosa.time_to_frames(beats, sr=sr, hop_length=hop)
    lb = np.array([low[f:f + 6].sum() for f in bf])
    phase = int(np.argmax([lb[p::4].mean() for p in range(4)]))
    bars = beats[phase::4]
    rms = librosa.feature.rms(y=y, hop_length=hop)[0]
    rt = librosa.times_like(rms, sr=sr, hop_length=hop)
    energy = [float(rms[(rt >= a) & (rt < b)].mean()) for a, b in zip(bars[:-1], bars[1:])]
    peak = max(energy)
    print(f"{os.path.basename(path)}  {dur:.1f}s  {tempo:.1f} BPM  beat {60 / tempo:.3f}s  bar {240 / tempo:.3f}s\n")
    print(" bar   time  energy")
    for i, (t, e) in enumerate(zip(bars, energy)):
        print(f"{i:4d} {t:6.2f}  {'#' * int(40 * e / peak)}")
    jumps = sorted(((energy[i] - energy[i - 1], i) for i in range(1, len(energy))), reverse=True)[:4]
    print("\ndrop candidates (energy jump INTO bar):", ", ".join(f"bar {i} @ {bars[i]:.2f}s (+{d:.3f})" for d, i in sorted(jumps, key=lambda x: x[1])))
    quiet = [i for i, e in enumerate(energy) if e < 0.6 * peak]
    if quiet:
        runs, start = [], quiet[0]
        for a, b in zip(quiet, quiet[1:] + [None]):
            if b != a + 1:
                runs.append((start, a)); start = b
        print("quiet stretches (breakdown / intro / outro):", ", ".join(f"{bars[a]:.2f}-{bars[min(b + 1, len(bars) - 1)]:.2f}s" for a, b in runs if b - a >= 1))
    # cut suggestions: jump from the end of bar i to the start of bar j, j-i a multiple of 8, similar harmony
    C = librosa.feature.chroma_cqt(y=y, sr=sr, hop_length=512)
    ct = librosa.times_like(C, sr=sr, hop_length=512)
    def bar_chroma(i):
        m = (ct >= bars[i]) & (ct < bars[min(i + 1, len(bars) - 1)])
        v = C[:, m].mean(1) if m.any() else np.zeros(12)
        return v / (np.linalg.norm(v) + 1e-9)
    cuts = []
    for i in range(4, len(bars) - 9):
        for n in (8, 16):
            j = i + n
            if j < len(bars) - 1:
                cuts.append((float(bar_chroma(i - 1) @ bar_chroma(j - 1)), bars[i], bars[j], n))
    cuts.sort(reverse=True)
    print("\nbest phrase cuts (keep ..A, resume at B):")
    for sim, a, b, n in cuts[:8]:
        print(f"  A={a:6.2f}  B={b:6.2f}  removes {n} bars ({b - a:.1f}s)  similarity {sim:.3f}")
    os.makedirs("out", exist_ok=True)
    json.dump({"duration": dur, "tempo": tempo, "beats": [round(float(b), 3) for b in beats], "bars": [round(float(b), 3) for b in bars], "energy": energy}, open("out/music.json", "w"))


def cut(path, points):
    pts = [float(p) for p in points]
    keep = [(0, pts[0])] + [(pts[i], pts[i + 1] if i + 1 < len(pts) else None) for i in range(1, len(pts), 2)]
    parts, chain = [], ""
    for k, (a, b) in enumerate(keep):
        end = f":end={b + 0.015}" if b else ""
        parts.append(f"[0:a]atrim=start={max(0, a - 0.015)}{end},asetpts=PTS-STARTPTS[p{k}]")
    chain = "[p0]"
    for k in range(1, len(keep)):
        nxt = f"[x{k}]"
        parts.append(f"{chain}[p{k}]acrossfade=d=0.03:c1=tri:c2=tri{nxt}")
        chain = nxt
    os.makedirs("public/music", exist_ok=True)
    out = "public/music/edit.wav"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", path, "-filter_complex", ";".join(parts), "-map", chain, "-ar", "48000", out], check=True)
    d = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", out], capture_output=True, text=True).stdout)
    print(f"{out}  {d:.2f}s")


if __name__ == "__main__":
    cmd, path, *rest = sys.argv[1:]
    analyze(path) if cmd == "analyze" else cut(path, rest)

"""Voice-over: script lines -> leveled WAVs + word timings.

  .venv/bin/python scripts/tts.py                 every line of src/project/script.txt  (id|text per line)
  .venv/bin/python scripts/tts.py --only 03,07    re-voice some lines
  .venv/bin/python scripts/tts.py voices          samples of the recommended voices -> out/voices/*.mp3

Writes public/vo/<id>.wav and src/project/vo.json {id: {dur, words: [[t, word], ...]}}.
Each line: Kokoro (local, free, Apache-2.0) -> silence trimmed -> leveled to -16 dBFS RMS with a measured gain
and a limiter. NOT loudnorm: on clips under ~3 s it leaves them 15-20 dB too quiet (found the hard way).
Word times come from whisper.cpp, but the words written to vo.json are the script's own spelling.
"""
import json, os, re, subprocess, sys, tempfile
import numpy as np
import soundfile as sf

CACHE = os.path.expanduser("~/.cache/video-kit")
KOKORO = (f"{CACHE}/kokoro/kokoro-v1.0.onnx", f"{CACHE}/kokoro/voices-v1.0.bin")
WHISPER = os.environ.get("WHISPER_CLI", "whisper-cli")
WMODEL = os.environ.get("WHISPER_MODEL", f"{CACHE}/whisper/ggml-base.en.bin")
cfg = json.load(open("video.config.json")).get("tts", {})
VOICE, SPEED, LANG = cfg.get("voice", "af_heart"), cfg.get("speed", 1.07), cfg.get("lang", "en-us")
TARGET_DB = -16.0


def kokoro():
    from kokoro_onnx import Kokoro
    return Kokoro(*KOKORO)


def ff(*args):
    subprocess.run(["ffmpeg", "-v", "error", "-y", *args], check=True)


def mean_db(path):
    out = subprocess.run(["ffmpeg", "-i", path, "-af", "volumedetect", "-f", "null", "-"], capture_output=True, text=True).stderr
    return float(re.search(r"mean_volume: ([-\d.]+)", out).group(1))


def whisper_words(wav):
    with tempfile.TemporaryDirectory() as d:
        mono = f"{d}/w.wav"
        ff("-i", wav, "-ar", "16000", "-ac", "1", mono)
        out = subprocess.run([WHISPER, "-m", WMODEL, "-f", mono, "-l", "en", "-ml", "1", "-sow", "-np"], capture_output=True, text=True).stdout
    words = []
    for line in out.splitlines():
        m = re.match(r"\[(\d+):(\d+):([\d.]+) --> [^\]]+\]\s*(\S.*)", line)
        if m:
            words.append((int(m[1]) * 3600 + int(m[2]) * 60 + float(m[3]), m[4].strip()))
    return words


def align(script_words, heard):
    """Script spelling, whisper timing. Words are matched by similarity (difflib); unmatched script words get
    times interpolated between their matched neighbours, so a misheard name never shifts the rest."""
    import difflib
    if not heard:
        return [[0.0, w] for w in script_words]
    norm = lambda w: re.sub(r"[^a-z0-9]", "", w.lower())
    times = [None] * len(script_words)
    sm = difflib.SequenceMatcher(None, [norm(w) for w in script_words], [norm(w) for _, w in heard], autojunk=False)
    for blk in sm.get_matching_blocks():
        for k in range(blk.size):
            times[blk.a + k] = heard[blk.b + k][0]
    end = heard[-1][0] + 0.3
    known = [(i, t) for i, t in enumerate(times) if t is not None] or [(0, heard[0][0])]
    for i in range(len(times)):
        if times[i] is None:
            prev = max((k for k in known if k[0] < i), default=(-1, heard[0][0]), key=lambda k: k[0])
            nxt = min((k for k in known if k[0] > i), default=(len(times), end), key=lambda k: k[0])
            times[i] = prev[1] + (nxt[1] - prev[1]) * (i - prev[0]) / (nxt[0] - prev[0])
    return [[round(t, 3), w] for t, w in zip(times, script_words)]


def voice_line(k, id_, text, vo):
    raw = f"/tmp/vk_{id_}.wav"
    a, sr = k.create(text, voice=VOICE, speed=SPEED, lang=LANG)
    sf.write(raw, a, sr)
    trimmed = f"/tmp/vk_{id_}_t.wav"
    ff("-i", raw, "-af", "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse", "-ar", "48000", trimmed)
    gain = TARGET_DB - mean_db(trimmed)
    out = f"public/vo/{id_}.wav"
    ff("-i", trimmed, "-af", f"volume={gain:.2f}dB,alimiter=limit=0.89:level=false", "-ar", "48000", out)
    dur = sf.info(out).duration
    # spoken words keep the script's spelling; "dot com" style words stay as written
    words = align(text.split(), whisper_words(out))
    vo[id_] = {"dur": round(dur, 3), "words": words}
    print(f"{id_}  {dur:5.2f}s  {mean_db(out):6.1f} dB  {text}")


def main():
    os.makedirs("public/vo", exist_ok=True)
    if sys.argv[1:2] == ["voices"]:
        k = kokoro()
        os.makedirs("out/voices", exist_ok=True)
        line = open("src/project/script.txt").readline().split("|", 1)[1].strip()
        for v in ["af_heart", "af_bella", "af_nicole", "af_sarah", "af_nova", "am_michael", "am_fenrir", "bf_emma", "bm_george"]:
            a, sr = k.create(line, voice=v, speed=SPEED, lang="en-gb" if v[0] == "b" else "en-us")
            sf.write(f"out/voices/{v}.wav", a, sr)
            ff("-i", f"out/voices/{v}.wav", "-b:a", "96k", f"out/voices/{v}.mp3")
            print("sample", v)
        return
    only = None
    if "--only" in sys.argv:
        only = set(sys.argv[sys.argv.index("--only") + 1].split(","))
    vo_path = "src/project/vo.json"
    vo = json.load(open(vo_path)) if os.path.exists(vo_path) else {}
    k = kokoro()
    for line in open("src/project/script.txt"):
        if "|" not in line:
            continue
        id_, text = (x.strip() for x in line.split("|", 1))
        if only and id_ not in only:
            continue
        voice_line(k, id_, text, vo)
    json.dump(vo, open(vo_path, "w"), indent=1, ensure_ascii=False)
    print("total speech", round(sum(v["dur"] for v in vo.values()), 1), "s")


if __name__ == "__main__":
    main()

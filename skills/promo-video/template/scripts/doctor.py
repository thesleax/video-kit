"""Doctor: catch, before rendering, every problem a previous film ran into. Run it after each capture / script /
timeline change and always before `npm run render`:

  .venv/bin/python scripts/doctor.py

Errors (✗) must be fixed; warnings (!) need a look. Each line says what was found and how it was fixed last time.
"""
import json, os, re, struct, subprocess, sys

E, W = [], []
err = lambda m: E.append(m)
warn = lambda m: W.append(m)
read = lambda p: open(p, encoding="utf-8").read() if os.path.exists(p) else ""

brand, scenes, timeline = read("src/project/brand.ts"), read("src/project/scenes.tsx"), read("src/project/timeline.ts")
outline, script = read("src/project/outline.md"), read("src/project/script.txt")
rects = json.loads(read("src/project/rects.json") or "{}")
vo = json.loads(read("src/project/vo.json") or "{}")
cfg = json.loads(read("video.config.json") or "{}")

# ---- template leftovers
if re.search(r'name:\s*"ACME"|url:\s*"acme\.com"', brand):
    err("brand.ts still has the template's ACME name/url — fill it from the product (SKILL step 2)")
if "_e.g." in outline or not outline.strip():
    err("outline.md is still the template — build the feature inventory first (must-shows, signed-in pages, interactions)")
if not os.path.exists("src/project/direction.ts"):
    err("no direction.ts — choose the look for this product (SKILL step 3, scripts/direct.py)")

# ---- brand assets
font = re.search(r'font:\s*\{[^}]*file:\s*"([^"]+)"', brand)
fpath = f"public/{font[1]}" if font else None
if not fpath or not os.path.exists(fpath):
    err(f"font file missing ({fpath}) — bash scripts/font.sh \"<Family>\" or copy the site's woff2")
else:
    data = open(fpath, "rb").read()
    def tags_woff2(b):
        known = "cmap head hhea hmtx maxp name OS/2 post cvt  fpgm glyf loca prep CFF  VORG EBDT EBLC gasp hdmx kern LTSH PCLT VDMX vhea vmtx BASE GDEF GPOS GSUB EBSC JSTF MATH CBDT CBLC COLR CPAL SVG  sbix acnt avar bdat bloc bsln cvar fdsc feat fmtx fvar gvar hsty just lcar mort morx opbd prop trak Zapf Silf Glat Gloc Feat Sill".split()
        n, pos, out = struct.unpack(">H", b[12:14])[0], 48, []
        def b128(p):
            v = 0
            for i in range(5):
                c = b[p + i]; v = (v << 7) | (c & 0x7F)
                if not c & 0x80: return v, p + i + 1
            return v, p + 5
        for _ in range(n):
            flags = b[pos]; pos += 1; idx = flags & 0x3F
            tag = b[pos:pos + 4].decode("latin1") if idx == 63 else known[idx] if idx < len(known) else "?"
            if idx == 63: pos += 4
            _, pos = b128(pos)
            ver = (flags >> 6) & 3
            if (tag in ("glyf", "loca") and ver == 0) or (tag not in ("glyf", "loca") and ver != 0):
                _, pos = b128(pos)
            out.append(tag.strip())
        return out
    if data[:4] == b"wOF2":
        if "fvar" not in tags_woff2(data):
            warn(f"{fpath} is a static (single-weight) font — captions lose their light/bold mix; use a variable font (scripts/font.sh)")
    elif data[:4] in (b"\x00\x01\x00\x00", b"true", b"OTTO"):
        if b"fvar" not in data[:12 + 16 * struct.unpack(">H", data[4:6])[0]]:
            warn(f"{fpath} is a static TTF/OTF — prefer a variable woff2 (scripts/font.sh)")
logo = re.search(r'logo:\s*\{[^}]*file:\s*"([^"]+)"', brand)
if not logo or not os.path.exists(f"public/{logo[1]}"):
    err(f"logo missing (public/{logo[1] if logo else '?'}) — copy the product's square mark")

# ---- captures
vw, vh = (cfg.get("viewport") or {}).get("width", 1440), (cfg.get("viewport") or {}).get("height", 900)
# only pages the film uses are checked; probes and old captures just get listed
used_pages = set(re.findall(r'(?:page=|rect\(\s*|to:\s*|pg:\s*|\[\s*[\d.]+\s*,\s*)"([\w-]+)"', scenes)) if scenes.strip() else set(rects)
unused = sorted(set(rects) - used_pages)
if unused:
    warn(f"captured but unused in scenes.tsx: {', '.join(unused)} — fine for probes; drop them from video.config.json to keep captures fast")
for name, page in rects.items():
    if name not in used_pages:
        continue
    if page.get("needsLogin"):
        err(f"page '{name}' landed on a login screen — add / refresh the session cookie (SKILL step 3) and re-capture")
    if page.get("h") == vh:
        warn(f"page '{name}' is exactly one viewport tall — an app shell whose inner scroller didn't unroll, or a short page; check the shot")
    jpg = f"public/pages/{name}.jpg"
    if not os.path.exists(jpg):
        err(f"page '{name}' has rects but no public/pages/{name}.jpg — run scripts/pages.py")
    else:
        try:
            from PIL import Image, ImageStat
            Image.MAX_IMAGE_PIXELS = None
            im = Image.open(f"public/pages/{name}_soft.jpg" if os.path.exists(f"public/pages/{name}_soft.jpg") else jpg).convert("L")
            top = im.crop((0, 0, im.width, min(im.height, im.width * 9 // 16)))
            if ImageStat.Stat(top).stddev[0] < 6:
                warn(f"page '{name}': the first screen is almost blank — lazy content or a skeleton loader; add waitFor and re-capture")
        except Exception:
            pass
    for q, hits in page.items():
        if not isinstance(hits, list):
            continue
        for r in hits:
            if len(r) < 4: continue
            x, y, w, h = r[:4]
            if q.startswith("card:"):
                if h < 60:
                    warn(f"'{name}' {q} is {w}×{h} — only a title bar, not the whole card")
                if w >= vw * 0.9 and h >= vh * 0.9 or (x <= 0 and y <= 0 and h >= vh):
                    warn(f"'{name}' {q} is {w}×{h} at {x},{y} — matched a page region (sidebar / layout), not a card; refine the label")
            if x >= vw or x + w <= 0:
                warn(f"'{name}' {q} has an off-page hit at x={x} (marquee copy?)")

# ---- rect() calls in scenes.tsx: exist, and clicks go where the scene says
for m in re.finditer(r'rect\(\s*"([^"]+)"\s*,\s*"((?:[^"\\]|\\.)*)"\s*(?:,\s*(\d+))?\s*\)', scenes):
    p, q, i = m[1], m[2].replace('\\"', '"'), int(m[3] or 0)
    if p not in rects:
        err(f"scenes.tsx uses page '{p}' that was never captured")
    elif q not in rects[p]:
        err(f"scenes.tsx uses {p} › {q} — not in rects.json; add the query to video.config.json and re-capture")
    elif len(rects[p][q]) <= i:
        err(f"scenes.tsx uses {p} › {q} [{i}] — only {len(rects[p][q])} hit(s)")
for m in re.finditer(r'r:\s*rect\(\s*"([^"]+)"\s*,\s*"((?:[^"\\]|\\.)*)"\s*(?:,\s*(\d+))?\s*\)\s*,\s*to:\s*"([^"]+)"', scenes):
    p, q, i, to = m[1], m[2].replace('\\"', '"'), int(m[3] or 0), m[4]
    hit = rects.get(p, {}).get(q, [])
    if len(hit) > i and len(hit[i]) > 4 and to in rects:
        href = hit[i][4].split("#")[0].rstrip("/")
        dest = re.sub(r"^https?://[^/]+", "", rects[to].get("url", "")).split("#")[0].rstrip("/")
        if href and dest and not (dest.endswith(href) or href.endswith(dest) or href.split("?")[0] == dest.split("?")[0]):
            err(f"fake click: {p} › {q}[{i}] links to {href} but the scene shows '{to}' ({dest})")
    elif len(hit) > i and len(hit[i]) <= 4:
        warn(f"click {p} › {q}[{i}] → '{to}' has no href (a button or a div): verify it with a capture page using \"click\"")

# ---- voice
lines = dict(l.split("|", 1) for l in script.strip().splitlines() if "|" in l)
for k, text in lines.items():
    k = k.strip()
    if k not in vo:
        err(f"voice line {k} is in script.txt but not voiced — run scripts/tts.py --only {k}")
    elif " ".join(w for _, w in vo[k]["words"]) != text.strip():
        err(f"voice line {k} changed since it was voiced — scripts/tts.py --only {k}")
used = set(re.findall(r'vo:\s*"([^"]+)"', timeline)) | set(re.findall(r'id:\s*"([^"]+)",\s*at', timeline))
for k in lines:
    if k.strip() not in used:
        warn(f"voice line {k.strip()} is never placed in timeline.ts")

# ---- timeline, music, sfx
if os.path.exists("node_modules"):
    r = subprocess.run(["npx", "tsx", "scripts/dump-timeline.ts"], capture_output=True, text=True)
    for l in (r.stderr + r.stdout).splitlines():
        if "overlap" in l: err(l.strip())
    if os.path.exists("public/timeline.json"):
        tl = json.load(open("public/timeline.json"))
        end = tl["end"]
        for v in tl["vo"]:
            if v["at"] + v["dur"] > end - 1.5:
                err(f"voice line {v['id']} ends at {v['at'] + v['dur']:.1f}s, too close to the end ({end}s)")
        gaps = [(a["at"] + a["dur"], b["at"]) for a, b in zip(tl["vo"], tl["vo"][1:])]
        for a, b in gaps:
            if b - a > 6:
                warn(f"{b - a:.1f}s without voice between {a:.1f}s and {b:.1f}s — fine on a music drop, a dead gap otherwise")
        music = re.search(r'file:\s*"([^"]+)"', timeline[timeline.find("MUSIC"):]) if "MUSIC" in timeline else None
        if music:
            mp = f"public/{music[1]}"
            if not os.path.exists(mp):
                err(f"music {mp} missing — the user downloads the track; scripts/music.py cut makes edit.wav")
            else:
                d = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", mp], capture_output=True, text=True).stdout or 0)
                if d < end - 0.5:
                    err(f"music is {d:.1f}s but the film is {end}s — it would stop early")
# effect names are the 2nd field of SFX tuples: `…), "click", 0.5` or `0.4, "sparkle", 0.3` (not scene ids in at("…"))
for f in set(re.findall(r'(?:\)|\d)\s*,\s*"([a-z-]+)"\s*,\s*[\d.]+', timeline)):
    if not os.path.exists(f"public/sfx/{f}.mp3"):
        err(f"sound effect '{f}' missing in public/sfx — bash scripts/fetch-sfx.sh")

# ---- privacy
if cfg.get("cookies"):
    ign = subprocess.run(["git", "check-ignore", "-q", "video.config.json"], capture_output=True).returncode == 0
    if not ign and os.path.exists(".git"):
        err("video.config.json holds a session cookie but isn't git-ignored")
    warn("a session cookie is in video.config.json — after the final render, remind the user to log out (ends the session)")
    if not (cfg.get("blurSelectors") or cfg.get("blurText") or any(p.get("blurSelectors") or p.get("blurText") or p.get("blurCards") for p in cfg.get("pages", []))):
        warn("signed-in pages but nothing is blurred — check shots for emails, API keys, other people's names")

for m in E: print("✗", m)
for m in W: print("!", m)
print(f"\n{len(E)} error(s), {len(W)} warning(s)" + ("" if E else " — ok to render" if not W else " — review the warnings"))
sys.exit(1 if E else 0)

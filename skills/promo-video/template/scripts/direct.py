"""Direction: read the product and rank the looks (src/kit/looks.ts) with the reasons, so every film's style comes
from the product instead of a fixed template.

  .venv/bin/python scripts/direct.py ..            (host project root; ../frontend for monorepos)

Signals: category words in README / i18n / landing copy, the site's fonts (serif, mono, geometric), how saturated
its primary colour is, and whether the captured pages are light or dark. Prints a ranked list with reasons, the
suggested `direct({...})` for src/project/direction.ts, and the matching music mood, SFX set and story shape.
The agent makes the call (references/DIRECTION.md) — this is evidence, not a verdict.
"""
import colorsys, glob, json, os, re, subprocess, sys

root = sys.argv[1] if len(sys.argv) > 1 else ".."
det = json.loads(subprocess.run(["node", "scripts/detect.mjs", root], capture_output=True, text=True).stdout)

# ---- text: README + English i18n + landing pages
text = ""
SKIP = re.compile(r"node_modules|/\.next/|/dist/|/build/|/\.git/|/vendor/")
for pat, cap in [("README*", 4), ("readme*", 4), ("docs/*.md", 6), ("**/messages/en.json", 2), ("**/locales/en*.json", 4), ("**/i18n/**/en*.json", 4),
                 ("**/i18n/dict/en.ts", 2), ("**/app/**/page.tsx", 12), ("**/pages/index.*", 4), ("**/components/**/*.tsx", 40), ("**/components/**/*.vue", 40)]:
    for f in [x for x in glob.glob(os.path.join(root, pat), recursive=True) if not SKIP.search(x)][:cap]:
        try:
            text += open(f, errors="ignore").read()[:60000].lower() + "\n"
        except OSError:
            pass

CATS = {
    "night": r"\b(game|gaming|gamer|roblox|minecraft|discord|server|guild|community|stream|twitch|esports|clan|player|leaderboard|bot)s?\b",
    "studio": r"\b(invoice|billing|finance|payment|crm|b2b|enterprise|team|workspace|workflow|analytics|dashboard|report|compliance|hr|saas|subscription|accounting)s?\b",
    "terminal": r"\b(api|sdk|cli|developer|devs?|code|repo|deploy|endpoint|webhook|terminal|infra|kubernetes|docker|open[- ]source|npm|library)s?\b",
    "editorial": r"\b(blog|magazine|article|story|stories|news|journal|recipe|portfolio|photography|writing|newsletter|podcast|book)s?\b",
    "kinetic": r"\b(shop|store|fashion|music|fitness|social|creator|friends|fun|kids|travel|food|dating|challenge|viral)s?\b",
}
counts = {k: len(re.findall(v, text)) for k, v in CATS.items()}
total = sum(counts.values()) or 1
score = {k: 4.0 * counts[k] / total for k in CATS}
why = {k: [f"{counts[k]} {k}-type words in the copy"] if counts[k] else [] for k in CATS}

# ---- fonts
fonts = " ".join(det.get("fonts", [])).lower()
SERIF = r"(?<!sans-)\bserif\b|playfair|fraunces|merriweather|lora|georgia|garamond|dm serif|source serif|libre baskerville|cormorant|instrument serif|newsreader"
if re.search(SERIF, fonts) and not re.search(r"sans-serif\b", fonts.replace("font-family: sans-serif", "")):
    score["editorial"] += 1.2; why["editorial"].append("a serif display font")
elif re.search(SERIF, fonts):
    score["editorial"] += 0.6; why["editorial"].append("a serif font among the site fonts")
if re.search(r"mono|jetbrains|fira code|ibm plex mono|geist mono", fonts):
    score["terminal"] += 0.4; why["terminal"].append("a monospace font")
if re.search(r"geist|inter|figtree|manrope|plus jakarta|sf pro|satoshi", fonts):
    score["studio"] += 0.3; why["studio"].append("a neutral geometric/grotesk UI font")

# ---- colours: brand.ts primary saturation, page lightness from captures
brand = open("src/project/brand.ts").read()
m = re.search(r'primary:\s*"#([0-9a-fA-F]{6})"', brand)
sat = light = None
if m:
    r, g, b = (int(m[1][i:i + 2], 16) / 255 for i in (0, 2, 4))
    h, light, sat = colorsys.rgb_to_hls(r, g, b)
    if sat > 0.6 and 0.35 < light < 0.75:
        score["night"] += 0.6; score["kinetic"] += 0.5; why["night"].append("a saturated accent colour"); why["kinetic"].append("a saturated accent colour")
    elif sat < 0.25:
        score["studio"] += 0.6; score["editorial"] += 0.4; why["studio"].append("a muted / monochrome accent"); why["editorial"].append("a muted / monochrome accent")
theme = "dark"
shots = glob.glob("public/pages/*_soft.jpg")
if shots:
    from PIL import Image, ImageStat
    lum = sum(ImageStat.Stat(Image.open(p).convert("L")).mean[0] for p in shots[:6]) / min(6, len(shots))
    theme = "light" if lum > 140 else "dark"
    if theme == "light":
        score["studio"] += 0.8; score["editorial"] += 0.6; why["studio"].append("light-themed pages"); why["editorial"].append("light-themed pages")

rank = sorted(score, key=lambda k: -score[k])
MOOD = {
    "night": ("future bass / energetic electronic (A Future Bass)", "ui", "hook → name on the hit → rapid feature tour on drop 1 → question in the breakdown → hero on drop 2 → outro"),
    "studio": ("calm-positive corporate / modern electronic (Upbeat Motivational Corporate, Play Right)", "soft", "problem → product → 3–4 pillars as numbered chapters → proof (numbers) → CTA"),
    "editorial": ("warm, sparse, piano/ambient-pop", "soft", "a sentence-led film: few scenes, long holds, each headline its own beat → CTA"),
    "kinetic": ("bright dance / pop, punchy", "playful", "fast hook → big word beats every bar → 3 quick features → loud CTA"),
    "terminal": ("techy electronic / minimal techno (Play Right, All In My Head)", "tech", "the job it does → how (real UI/code) → speed/scale numbers → docs/CTA"),
}
print(f"product: {det.get('framework')} · {', '.join(det.get('liveUrlHints', [])[:1]) or 'no live URL found'} · pages look {theme}"
      + (f" · primary sat {sat:.2f} light {light:.2f}" if sat is not None else ""))
print("\nlooks, best first:")
for k in rank:
    print(f"  {k:<10} {score[k]:4.2f}  " + ("; ".join(why[k]) or "no signal"))
best = rank[0]
print(f"\nsuggested src/project/direction.ts:\n  export const DIRECTION = direct({{ look: \"{best}\"" + (', theme: "light"' if theme == "light" else "") + " });")
print(f"music mood: {MOOD[best][0]}\nsfx set:    {MOOD[best][1]}\nstory:      {MOOD[best][2]}")
if score[rank[0]] - score[rank[1]] < 0.4:
    print(f"\nclose call between {rank[0]} and {rank[1]}: decide from the audience and the hero feature (references/DIRECTION.md).")

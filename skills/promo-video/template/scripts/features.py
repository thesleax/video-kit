"""Features: inventory everything the product can do, straight from its source, so the film can't skip a system.

  .venv/bin/python scripts/features.py ..            (host project root; ../frontend for monorepos)

Finds every page route (Next app/pages, Nuxt, SvelteKit, Astro, Remix, vue-router), classifies it (public / signed-in /
premium / admin / auth / legal), and lists the sections each page renders: headings, `title=` props and i18n titles
(resolved from the English messages file), plus the tabs it switches between. Pages behind a tab or a [param] are
called out — those are the panels a shallow film misses (a per-server "command center", a profile's tabs).

Writes out/features.md. The agent turns it into src/project/outline.md, then asks the user which areas must be in the
film and which must stay out (SKILL step 2) — or picks itself when the user leaves it to the agent.
"""
import glob, json, os, re, sys

root = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else "..")
SKIP = re.compile(r"node_modules|/\.next/|/\.nuxt/|/\.svelte-kit/|/dist/|/build/|/\.git/|/\.output/")

# ---- English strings, for t('key') / tx.key / $t('key')
msgs = {}
for f in [x for p in ("**/messages/en.json", "**/locales/en*.json", "**/i18n/**/en*.json", "**/lang/en*.json") for x in glob.glob(os.path.join(root, p), recursive=True)]:
    if SKIP.search(f): continue
    try:
        def walk(d, p=""):
            for k, v in d.items():
                if isinstance(v, dict): walk(v, f"{p}{k}.")
                elif isinstance(v, str): msgs[k] = msgs.get(k, v); msgs[p + k] = v
        walk(json.load(open(f)))
    except Exception:
        pass

# ---- routes
def route_of(f):
    rel = os.path.relpath(f, root).replace(os.sep, "/")
    m = re.search(r"(?:^|/)app/(.*)/?(?:page|\+page)\.(?:tsx|jsx|ts|js|mdx|svelte)$", rel) or re.search(r"(?:^|/)routes/(.*?)/?\+page\.svelte$", rel)
    if m: path = m[1]
    else:
        m = re.search(r"(?:^|/)(?:src/)?pages/(.*)\.(?:tsx|jsx|vue|astro|md|mdx)$", rel)
        if not m or "/api/" in rel or os.path.basename(rel).startswith("_"): return None
        path = re.sub(r"(^|/)index$", "", m[1])
    path = re.sub(r"\([^)]*\)/?", "", path)              # route groups
    path = re.sub(r"\[\[?\.{0,3}(locale|lang)\]\]?/?", "", path)  # locale segments
    return "/" + path.strip("/")

files = [f for ext in ("tsx", "jsx", "vue", "svelte", "astro", "mdx") for f in glob.glob(os.path.join(root, f"**/*.{ext}"), recursive=True) if not SKIP.search(f)]
pages = {}
for f in files:
    r = route_of(f)
    if r is not None and re.search(r"(page|\+page)\.\w+$|/pages/", f.replace(os.sep, "/")):
        pages.setdefault(r, f)

def kind(r, src):
    if re.search(r"^/admin|/admin/", r): return "admin"
    if re.search(r"login|signin|sign-in|signup|register|callback|logout|oauth", r): return "auth"
    if re.search(r"privacy|terms|cookies|legal|imprint|license|maintenance|404|500", r): return "legal"
    if re.search(r"^/(dashboard|app|account|settings|me|console|panel|studio|workspace)\b", r): return "signed-in"
    return "public"

# a page is premium when it gates or sells something itself, not because the nav links to /premium
PREMIUM = re.compile(r"\b(isPremium|is_premium|premiumOnly|requirePremium|paywall|upsell\w*|Upsell\w*|limit reached|upgrade to|subscription|pricing|perks?|tier)\b")

# ---- sections a page renders: its own file + local components it imports (two levels)
imp = re.compile(r"""from\s+['"](@/|~/|\.{1,2}/)([^'"]+)['"]""")
def resolve(base, alias, p):
    roots = [os.path.join(root, "src"), root] if alias in ("@/", "~/") else [os.path.dirname(base)]
    for r0 in roots:
        for ext in ("", ".tsx", ".jsx", ".ts", ".vue", ".svelte", "/index.tsx", "/index.ts"):
            c = os.path.normpath(os.path.join(r0, (alias if alias.startswith(".") else "") + p + ext))
            if os.path.isfile(c): return c
def tree(f, depth=2, seen=None):
    seen = seen or set()
    if f in seen or not f: return seen
    seen.add(f)
    if depth:
        for a, p in imp.findall(open(f, errors="ignore").read()):
            c = resolve(f, a, p)
            if c and re.search(r"components?|features?|panels?|sections?|views?|widgets?", c) and not re.search(r"/ui/|ui-kit|icons?", c):
                tree(c, depth - 1, seen)
    return seen

def titles(src):
    out = []
    for m in re.finditer(r"<h[1-3][^>]*>\s*([^<{][^<]{2,60})<", src): out.append(m[1].strip())
    for m in re.finditer(r"""\b(?:title|heading|label)=["']([^"'{}]{3,50})["']""", src): out.append(m[1])
    for m in re.finditer(r"""(?:\bt|\$t|tx|i18n\.t)(?:\(\s*['"]|\.)([\w.]*(?:Title|Heading|Tab\w*|tab\w*))\b""", src):
        if m[1] in msgs: out.append(msgs[m[1]])
    return list(dict.fromkeys(x.strip() for x in out if not re.search(r"[{}$\n]|=>|//|^\W+$|^(Partners|Server|Servers)$", x)))

rows = []
for r, f in sorted(pages.items()):
    srcs = tree(f)
    src = "\n".join(open(x, errors="ignore").read() for x in srcs)
    k = kind(r, src)
    prem = bool(PREMIUM.search(src))
    secs = titles(src)
    tabs = re.findall(r"""\[\s*['"](\w+)['"]\s*,\s*(?:tx|t)\.?\(?['"]?(\w*Tab\w*)""", src)
    rows.append({"route": r, "kind": k, "premium": prem, "dynamic": "[" in r, "sections": secs[:24], "tabs": [msgs.get(t[1], t[0]) for t in tabs], "files": len(srcs)})

order = {"signed-in": 0, "public": 1, "admin": 3, "auth": 4, "legal": 5}
rows.sort(key=lambda x: (order.get(x["kind"], 2), x["route"]))
os.makedirs("out", exist_ok=True)
with open("out/features.md", "w") as o:
    o.write(f"# Feature inventory — {os.path.basename(root)}\n\n{len(rows)} pages. Depth = sections found in the page and the components it renders.\n\n")
    o.write("| Route | Access | Premium? | Depth | Tabs | Sections |\n|---|---|---|---|---|---|\n")
    for x in rows:
        o.write(f"| `{x['route']}` | {x['kind']} | {'yes' if x['premium'] else ''} | {len(x['sections'])} | {', '.join(x['tabs'])} | {'; '.join(x['sections'][:14])} |\n")
for x in rows:
    if x["kind"] in ("auth", "legal"): continue
    flag = " ★premium" if x["premium"] else ""
    flag += " ◆deep" if len(x["sections"]) >= 7 else ""
    flag += " (per-item page: capture one real id)" if x["dynamic"] else ""
    print(f"{x['kind']:<9} {x['route']:<38}{flag}")
    if x["tabs"]: print(f"{'':10}tabs: {', '.join(x['tabs'])}")
    if x["sections"]: print(f"{'':10}{'; '.join(x['sections'][:10])}" + (" …" if len(x["sections"]) > 10 else ""))
deep = [x["route"] for x in rows if len(x["sections"]) >= 7 and x["kind"] in ("signed-in", "public")]
print(f"\n{len(rows)} pages → out/features.md. Deepest (★ film these properly, several shots each): {', '.join(deep[:8]) or '—'}")
print("Admin pages are the owner's tools: leave them out unless the user asks.")

// Reads the HOST project (default: the folder this kit was cloned into) and prints what the video needs:
// framework + how to run it, the public URL if any, brand colors (CSS custom properties / Tailwind), fonts,
// logo files and the routes worth filming. Framework-agnostic: anything that serves pages in a browser works,
// because the video is filmed from the running site, never from its source code.
//   node scripts/detect.mjs ..        (npm run detect)
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { existsSync as exists0 } from "node:fs";
let ROOT = process.argv[2] ?? "..";
// monorepos: the web app usually sits one level down
if (!exists0(join(ROOT, "package.json"))) {
  const sub = ["frontend", "web", "client", "app", "site", "apps/web", "apps/site", "apps/frontend", "packages/web"].find((d) => exists0(join(ROOT, d, "package.json")));
  if (sub) { console.error(`(web app found in ${sub}/)`); ROOT = join(ROOT, sub); }
}
const SKIP = new Set(["node_modules", ".git", ".next", ".nuxt", ".output", "dist", "build", ".astro", ".svelte-kit", "vendor", "video", "coverage", ".turbo", ".vercel"]);
const read = (p) => { try { return readFileSync(join(ROOT, p), "utf8"); } catch { return ""; } };
const walk = (dir, out = [], depth = 0) => {
  if (depth > 7) return out;
  for (const n of readdirSync(join(ROOT, dir), { withFileTypes: true })) {
    if (SKIP.has(n.name) || n.name.startsWith(".")) continue;
    const p = join(dir, n.name);
    n.isDirectory() ? walk(p, out, depth + 1) : out.push(p);
  }
  return out;
};
const files = walk(".");
const pkg = (() => { try { return JSON.parse(read("package.json")); } catch { return null; } })();
const deps = { ...pkg?.dependencies, ...pkg?.devDependencies };

// ---- framework + run command
const FW = [
  ["next", "Next.js", 3000], ["nuxt", "Nuxt", 3000], ["astro", "Astro", 4321], ["@sveltejs/kit", "SvelteKit", 5173],
  ["@remix-run/react", "Remix", 3000], ["gatsby", "Gatsby", 8000], ["@angular/core", "Angular", 4200], ["solid-start", "SolidStart", 3000],
  ["vue", "Vue (Vite)", 5173], ["react", "React (Vite/CRA)", 5173], ["svelte", "Svelte", 5173],
];
const fw = FW.find(([d]) => deps[d]);
const other = existsSync(join(ROOT, "composer.json")) ? ["PHP / Laravel", "php artisan serve", 8000]
  : existsSync(join(ROOT, "manage.py")) ? ["Django", "python manage.py runserver", 8000]
  : existsSync(join(ROOT, "Gemfile")) ? ["Rails", "bin/rails server", 3000] : null;
const scripts = pkg?.scripts ?? {};
const devCmd = scripts.dev ? "npm run dev" : scripts.start ? "npm start" : other?.[1];

// ---- public URL hints, ranked: site config / metadata / sitemap code beat READMEs; template boilerplate is ignored
const BOILER = /(^|\.)(alanadi\.com|yourdomain\.com|domain\.com|mysite\.com|acme\.com|nextjs\.org|vercel\.(com|app)|example\.(com|org)|github\.com|githubusercontent\.com|npmjs\.(com|org)|schema\.org|w3\.org|x\.com|twitter\.com|google(apis)?\.com|gstatic\.com|nuxt\.com|astro\.build|vitejs\.dev|svelte\.dev|react\.dev|tailwindcss\.com|shields\.io|cloudflare\.com|stripe\.com|discord\.(gg|com)|youtube\.com|facebook\.com|instagram\.com|linkedin\.com|mozilla\.org|wikipedia\.org|localhost)$/i;
const score = new Map();
const hint = (u, w) => {
  try { const h = new URL(u).hostname.replace(/^www\./, ""); if (!BOILER.test(h) && /\.[a-z]{2,}$/i.test(h)) score.set(h, (score.get(h) ?? 0) + w); } catch {}
};
for (const f of files) {
  const strong = /(astro|next|nuxt|svelte|vite)\.config\.|\.env(\.|$)|CNAME$|(layout|metadata|sitemap|robots|seo|site|config|constants?)\.(tsx?|jsx?|mjs|vue|astro|json)$/i.test(f);
  const weak = /package\.json$|README|\.md$/i.test(f);
  if (!strong && !weak) continue;
  const src = read(f);
  if (f.endsWith("CNAME")) hint("https://" + src.trim(), 10);
  for (const m of src.matchAll(/https?:\/\/[a-z0-9.-]+\.[a-z]{2,}/gi)) hint(m[0], strong ? 3 : 1);
  for (const m of src.matchAll(/(metadataBase|siteUrl|SITE_URL|site_url|baseUrl|BASE_URL|canonical|site)\s*[:=(]\s*(?:new URL\()?\s*["'`](https?:\/\/[^"'`]+)/g)) hint(m[2], 8);
}
// a project folder named like a domain (acme.com/) is a strong hint too
for (const seg of (ROOT === "." ? process.cwd() : join(process.cwd(), ROOT)).split("/")) if (/^[a-z0-9-]+\.(com|dev|me|io|app|net|org|co|gg|ai|tr|xyz)$/i.test(seg)) hint("https://" + seg, 6);
const urlHints = [...score].sort((a, b) => b[1] - a[1]).map(([h]) => "https://" + h);

// Colour → "#rrggbb" for brand.ts (keeps the original in brackets when converted).
function toHex(v) {
  const hex = (r, g, b) => "#" + [r, g, b].map((x) => Math.round(Math.min(255, Math.max(0, x))).toString(16).padStart(2, "0")).join("");
  const num = (x, pct = 1) => (x.endsWith("%") ? parseFloat(x) / 100 * pct : parseFloat(x));
  const hsl = (h, s, l) => { const k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l); return [0, 8, 4].map((n) => 255 * (l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1)))); };
  let m, out;
  if (/^#[0-9a-f]{6}$/i.test(v)) return v.toLowerCase();
  if ((m = v.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/i))) out = "#" + m[1] + m[1] + m[2] + m[2] + m[3] + m[3];
  else if ((m = v.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/))) out = hex(+m[1], +m[2], +m[3]);
  else if ((m = v.match(/^(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)$/))) out = hex(+m[1], +m[2], +m[3]); // "9 9 11" channels
  else if ((m = v.match(/^(?:hsla?\(\s*)?([\d.]+)(?:deg)?[\s,]+([\d.]+)%[\s,]+([\d.]+)%/))) out = hex(...hsl(+m[1], +m[2] / 100, +m[3] / 100));
  else if ((m = v.match(/^oklch\(\s*([\d.]+%?)\s+([\d.]+%?)\s+([\d.]+)/))) {
    const L = num(m[1]), C = num(m[2], 0.4), h = (+m[3] * Math.PI) / 180;
    const a = C * Math.cos(h), b = C * Math.sin(h);
    const l_ = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3, m_ = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3, s_ = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
    const lin = [4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_, -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_, -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_];
    out = hex(...lin.map((c) => 255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.max(c, 0) ** (1 / 2.4) - 0.055)));
  }
  return out ? `${out}  (${v})` : v;
}

// ---- brand: CSS custom properties (light + dark blocks), Tailwind theme colors
const css = files.filter((f) => /\.(css|scss|sass|less|pcss)$/.test(f));
const tokens = {};
for (const f of css) {
  const src = read(f);
  for (const block of src.matchAll(/([^{}]+)\{([^{}]*--[^{}]*)\}/g)) {
    const sel = block[1].trim().split("\n").pop().trim();
    // base themes only: skip accent/variant overrides like .dark[data-accent="purple"]
    if (/\[(?!data-theme|class)/.test(sel) || /:(hover|focus|not)/.test(sel)) continue;
    const scope = /dark/i.test(sel) ? "dark" : /@theme/.test(sel) ? "theme" : "light";
    for (const m of block[2].matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) {
      if (/^(color-|tw-|font-(size|weight))/.test(m[1])) continue;
      const v = m[2].trim();
      if ((/^(#|rgb|hsl|oklch|oklab|lab|lch|color\()/.test(v) || /^\d+(\.\d+)?%?\s+\d/.test(v)) && !(tokens[scope] ??= {})[m[1]]) tokens[scope][m[1]] = toHex(v);
    }
  }
}
const tw = files.filter((f) => /tailwind\.config\./.test(f)).map((f) => ({ file: f, colors: (read(f).match(/colors\s*:\s*\{[\s\S]{0,1200}?\n\s*\}/) ?? [""])[0].slice(0, 600) }));

// ---- fonts
const fonts = new Set();
Object.keys(deps).filter((d) => d.startsWith("@fontsource")).forEach((d) => fonts.add(`${d} (npm → node_modules/${d}/files/*.woff2)`));
for (const f of files.filter((f) => /\.(tsx?|jsx?|vue|svelte|astro|html|css)$/.test(f))) {
  const s = read(f);
  for (const m of s.matchAll(/from\s+["']next\/font\/google["'][\s\S]{0,0}|import\s*\{([^}]+)\}\s*from\s*["']next\/font\/google["']/g)) if (m[1]) fonts.add(`next/font/google: ${m[1].trim()}`);
  for (const m of s.matchAll(/fonts\.googleapis\.com\/css2?\?family=([^"'&)]+)/g)) fonts.add(`Google Fonts: ${decodeURIComponent(m[1]).replace(/\+/g, " ")}`);
  for (const m of s.matchAll(/family\s*:\s*["']([^"']+)["']/g)) if (/nuxt\.config|fonts/.test(f)) fonts.add(`config font: ${m[1]}`);
  for (const m of s.matchAll(/font-family\s*:\s*([^;}{]+)/g)) if (!/var\(|inherit|system-ui|monospace/.test(m[1])) fonts.add(`font-family: ${m[1].trim().slice(0, 60)}`);
}
files.filter((f) => /\.woff2$/.test(f)).slice(0, 8).forEach((f) => fonts.add(`file: ${f}`));

// ---- logo candidates
const logos = files.filter((f) => /(favicon|logo|icon|brand|mark)[^/]*\.(svg|png)$/i.test(f) && statSync(join(ROOT, f)).size < 400_000)
  .sort((a, b) => (/\.svg$/.test(b) - /\.svg$/.test(a)) || a.length - b.length).slice(0, 12);

// ---- routes worth filming
const routes = new Set();
for (const f of files) {
  let m;
  if ((m = f.match(/^(?:src\/)?app\/(.*?)\/?page\.(tsx?|jsx?|mdx)$/))) routes.add("/" + m[1].replace(/\([^)]*\)\/?/g, ""));
  else if ((m = f.match(/^(?:src\/)?pages\/(.*)\.(tsx?|jsx?|vue|astro|svelte|md|mdx)$/)) && !/^(_|api\/)/.test(m[1])) routes.add("/" + m[1].replace(/(^|\/)index$/, ""));
  else if ((m = f.match(/^src\/routes\/(.*?)\/?\+page\.svelte$/))) routes.add("/" + m[1]);
  else if ((m = f.match(/^app\/pages\/(.*)\.vue$/))) routes.add("/" + m[1].replace(/(^|\/)index$/, "")); // Nuxt 4
}

const out = {
  project: relative(process.cwd(), ROOT) || ".",
  framework: fw ? fw[1] : other?.[0] ?? "static / unknown (serve the folder or use the live URL)",
  run: devCmd ? `${devCmd}  →  http://localhost:${fw?.[2] ?? other?.[2] ?? 3000}` : "no dev script found",
  liveUrlHints: [...urlHints].slice(0, 10),
  colorTokens: tokens,
  tailwind: tw,
  fonts: [...fonts].slice(0, 15),
  logoFiles: logos,
  routes: [...routes].sort().slice(0, 80),
  notes: [
    ...([...routes].some((r) => /\[(locale|lang|lng)\]/.test(r)) ? ["routes are locale-prefixed: film them under the default locale (e.g. /en/…); check which prefix the live site uses"] : []),
    ...(!Object.keys(tokens.dark ?? {}).length ? ["no dark-theme tokens found: the site may be light-only (set colorScheme \"light\") or define dark colours in JS/Tailwind config"] : []),
    ...(!logos.length ? ["no logo file found: look for an inline <svg> logo component and save it as public/brand/logo.svg"] : []),
  ],
};
console.log(JSON.stringify(out, null, 2));

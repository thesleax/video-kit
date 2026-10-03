// Reads the HOST project (default: the folder this kit was cloned into) and prints what the video needs:
// framework + how to run it, the public URL if any, brand colors (CSS custom properties / Tailwind), fonts,
// logo files and the routes worth filming. Framework-agnostic: anything that serves pages in a browser works,
// because the video is filmed from the running site, never from its source code.
//   node scripts/detect.mjs ..        (npm run detect)
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.argv[2] ?? "..";
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

// ---- public URL hints
const urlHints = new Set();
for (const f of files.filter((f) => /(astro|next|nuxt|vite|svelte)\.config\.|\.env(\.|$)|CNAME$|package\.json$|README/i.test(f))) {
  for (const m of read(f).matchAll(/https?:\/\/(?!localhost|127\.|github\.com|npmjs|schema\.org|www\.w3\.org)[a-z0-9.-]+\.[a-z]{2,}(?:\/[^\s"'`)]*)?/gi)) urlHints.add(m[0].replace(/[.,;]+$/, ""));
  if (f.endsWith("CNAME")) urlHints.add("https://" + read(f).trim());
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
    const scope = /dark/i.test(sel) ? "dark" : "light";
    for (const m of block[2].matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) {
      if (/^(color-|tw-|font-(size|weight))/.test(m[1])) continue;
      const v = m[2].trim();
      if ((/^(#|rgb|hsl|oklch|oklab|lab|lch|color\()/.test(v) || /^\d+(\.\d+)?%?\s+\d/.test(v)) && !(tokens[scope] ??= {})[m[1]]) tokens[scope][m[1]] = v;
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
};
console.log(JSON.stringify(out, null, 2));

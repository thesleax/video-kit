// Captures full-page screenshots of the running product (any framework: it only needs a URL) plus the
// page-space rects of everything the cursor or a lift will touch. Output:
//   public/pages/<name>.png   (2x)          src/project/rects.json  { page: { h, "<query>": [[x,y,w,h,href?]…] } }
// Query forms (all rects in CSS px of the full page):
//   "css:<selector>"   every visible match, document order (≤14), with the link's real href
//   "card:<regex>"     the bordered/filled card around the shortest element whose text matches (case-insensitive)
//   "re:<regex>"       innermost elements whose text matches, document order
//   "<exact text>"     smallest element with exactly that text → its clickable ancestor
// Page options: path, queries, click (text of a control to press first), waitFor (selector), tall (keep N px).
// Config options: site, viewport, scale, colorScheme, locale, headers, cookies, localStorage, hideSelectors, hideFixedText.
// Usage: node scripts/capture.mjs            all pages in video.config.json
//        ONLY=home,pricing node scripts/capture.mjs   re-shoot some (rects.json is merged)
import { chromium } from "playwright";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const CFG = JSON.parse(readFileSync("video.config.json", "utf8"));
const BASE = process.env.SITE ?? CFG.site;
const ONLY = process.env.ONLY?.split(",");
const RECTS = "src/project/rects.json";

async function settle(page) {
  // lazy images and sections load only once scrolled into view
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 500) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 200)); }
    window.scrollTo(0, 0);
    const loads = Promise.all([...document.images].map((i) => i.complete || new Promise((r) => { i.onload = i.onerror = r; })));
    await Promise.race([loads, new Promise((r) => setTimeout(r, 8000))]);
  });
  await page.waitForTimeout(2500);
}

async function hideOverlays(page) {
  if (CFG.hideSelectors?.length) await page.addStyleTag({ content: `${CFG.hideSelectors.join(",")}{display:none!important} *{scroll-behavior:auto!important}` });
  // consent dialogs and chat widgets often re-mount after navigation: hide fixed boxes containing these words
  await page.evaluate((words) => {
    const re = words.length ? new RegExp(words.join("|"), "i") : null;
    if (!re) return;
    for (const e of document.querySelectorAll("body *")) if (getComputedStyle(e).position === "fixed" && re.test(e.innerText)) e.style.display = "none";
  }, CFG.hideFixedText ?? []);
}

const rectsOf = (page, q) => page.evaluate((q) => {
  const box = (e) => { const r = e.getBoundingClientRect(); const a = e.closest("a"); return [...[r.x, r.y + scrollY, r.width, r.height].map(Math.round), ...(a ? [a.getAttribute("href")] : [])]; };
  const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  if (q.startsWith("css:")) return [...document.querySelectorAll(q.slice(4))].filter(vis).slice(0, 14).map(box);
  const text = [...document.querySelectorAll("a,button,[role=tab],h1,h2,h3,h4,span,div,p,td,li,label")].filter(vis);
  if (q.startsWith("card:")) {
    const re = new RegExp(q.slice(5), "i");
    let e = text.filter((x) => re.test(x.innerText.trim())).sort((a, b) => a.innerText.length - b.innerText.length)[0];
    const isCard = (x) => { const c = getComputedStyle(x); return x.getBoundingClientRect().width > 150 && (parseFloat(c.borderTopWidth) > 0 || !/rgba\(0, 0, 0, 0\)|transparent/.test(c.backgroundColor)); };
    while (e && e !== document.body && !isCard(e)) e = e.parentElement;
    return e && e !== document.body ? [box(e)] : [];
  }
  const re = q.startsWith("re:") ? new RegExp(q.slice(3)) : null;
  const hits = text.filter((e) => (re ? re.test(e.innerText.trim()) : e.innerText.trim() === q));
  if (re) return hits.filter((e) => !hits.some((o) => o !== e && e.contains(o))).slice(0, 8).map(box);
  hits.sort((a, b) => a.getBoundingClientRect().width * a.getBoundingClientRect().height - b.getBoundingClientRect().width * b.getBoundingClientRect().height);
  const e = hits[0];
  return e ? [box(e.closest("a,button,[role=tab]") ?? e)] : [];
}, q);

mkdirSync("public/pages", { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: CFG.viewport ?? { width: 1440, height: 900 }, deviceScaleFactor: CFG.scale ?? 2, colorScheme: CFG.colorScheme ?? "dark", locale: CFG.locale ?? "en-US", extraHTTPHeaders: CFG.headers });
// signed-in pages: a demo account's session cookie and/or localStorage (never a real user's)
if (CFG.cookies?.length) await ctx.addCookies(CFG.cookies.map((c) => ({ path: "/", url: c.domain ? undefined : BASE, ...c })));
if (CFG.localStorage) await ctx.addInitScript((kv) => { for (const [k, v] of Object.entries(kv)) localStorage.setItem(k, typeof v === "string" ? v : JSON.stringify(v)); }, CFG.localStorage);
const out = {};
for (const job of CFG.pages.filter((p) => !ONLY || ONLY.includes(p.name))) {
  const page = await ctx.newPage();
  await page.goto(BASE + job.path, { waitUntil: "load", timeout: 60000 });
  if (job.waitFor) await page.waitForSelector(job.waitFor, { timeout: 30000 });
  await hideOverlays(page);
  if (job.click) {
    // the shot shows the state a real click on this control produces
    await page.getByText(job.click, { exact: true }).first().click();
    await page.waitForLoadState("load");
    await page.waitForTimeout(2000);
  }
  await settle(page);
  await hideOverlays(page);
  out[job.name] = { h: await page.evaluate(() => document.body.scrollHeight), url: page.url() };
  for (const q of job.queries ?? []) out[job.name][q] = await rectsOf(page, q);
  await page.screenshot({ path: `public/pages/${job.name}.png`, fullPage: true });
  console.log(`${job.name.padEnd(18)} ${out[job.name].h}px  ${page.url()}`);
  await page.close();
}
const prev = ONLY && existsSync(RECTS) ? JSON.parse(readFileSync(RECTS, "utf8")) : {};
writeFileSync(RECTS, JSON.stringify({ ...prev, ...out }, null, 1));
await browser.close();

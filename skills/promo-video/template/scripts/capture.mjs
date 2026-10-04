// Captures full-page screenshots of the running product (any framework: it only needs a URL) plus the
// page-space rects of everything the cursor or a lift will touch. Output:
//   public/pages/<name>.png   (2x)          src/project/rects.json  { page: { h, "<query>": [[x,y,w,h,href?]…] } }
// Query forms (all rects in CSS px of the full page):
//   "css:<selector>"   every visible match, document order (≤14), with the link's real href
//   "card:<regex>"     the bordered/filled card around the shortest element whose text matches (case-insensitive)
//   "re:<regex>"       innermost elements whose text matches, document order
//   "<exact text>"     smallest element with exactly that text → its clickable ancestor
// Page options: path, queries, click (text of a control to press first), waitFor (selector), tall (keep N px),
//   blurSelectors / blurText / blurCards / blurPeople (per page, on top of the global ones).
// Config options: site, viewport, scale, colorScheme, locale, headers, cookies, localStorage, blurSelectors, blurText, hideSelectors,
//   hideFixedText (words: hides fixed/sticky/absolute popovers, banners and promo boxes containing them).
// Usage: node scripts/capture.mjs            all pages in video.config.json
//        ONLY=home,pricing node scripts/capture.mjs   re-shoot some (rects.json is merged)
import { chromium } from "playwright";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const CFG = JSON.parse(readFileSync("video.config.json", "utf8"));
const BASE = process.env.SITE ?? CFG.site;
const ONLY = process.env.ONLY?.split(",");
const RECTS = "src/project/rects.json";

// App shells (dashboards) scroll inside a full-height panel, so a "full page" shot is one screen tall.
// Unroll every large inner scroller and the fixed-height ancestors around it so the whole content is on the page.
async function unrollScrollers(page) {
  await page.evaluate(() => {
    const big = [...document.querySelectorAll("body *")].filter((e) => {
      const c = getComputedStyle(e);
      return /(auto|scroll)/.test(c.overflowY) && e.scrollHeight > e.clientHeight + 40 && e.clientHeight > 300 && e.clientWidth > innerWidth * 0.4;
    });
    // the scroller and EVERY ancestor up to <html>: smooth-scroll libraries (Lenis, Locomotive) and h-screen
    // layouts lock heights and overflow at several levels
    for (const e of big) {
      for (let x = e; x; x = x.parentElement) {
        x.style.setProperty("overflow", "visible", "important");
        x.style.setProperty("height", "auto", "important");
        x.style.setProperty("max-height", "none", "important");
      }
    }
  });
}

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

async function hideOverlays(page, job = {}) {
  // personal data on signed-in pages (emails, API keys, other people's names…): blurred in the shot, never sharp.
  // blurSelectors = CSS; blurText = regexes matched against an element's own text (e.g. "^stk_", "@\\w+").
  const sel = [...(CFG.blurSelectors ?? []), ...(job.blurSelectors ?? [])];
  if (sel.length) await page.addStyleTag({ content: `${sel.join(",")}{filter:blur(7px)!important}` });
  // blurCards = labels of whole cards to blur (e.g. "voice companions": other people's names in a list)
  const cards = [...(CFG.blurCards ?? []), ...(job.blurCards ?? [])].map((l) => ["all", l]);
  // blurPeople = labels of cards listing people (a top-members table, a visitors list): each row with an avatar gets
  // its avatar and name blurred, while numbers, bars and the card title stay sharp — the feature reads, nobody shows
  const people = [...(CFG.blurPeople ?? []), ...(job.blurPeople ?? [])].map((l) => ["people", l]);
  if (cards.length || people.length) await page.evaluate((jobs) => {
    const isCard = (x) => { const c = getComputedStyle(x); return x.getBoundingClientRect().width > 150 && (parseFloat(c.borderTopWidth) > 0 || !/rgba\(0, 0, 0, 0\)|transparent/.test(c.backgroundColor)); };
    const numeric = (t) => /^[\s#\d.,:%+\-−×xX~<>]*([dhms]|min|hrs?|[KMB]|msgs?|members?|views?|sessions?)?[\s\d.,:%dhms]*$/i.test(t);
    for (const [mode, l] of jobs) {
      const re = new RegExp(l, "i");
      const hit = [...document.querySelectorAll("h1,h2,h3,h4,p,span,div")].filter((e) => re.test(e.innerText?.trim() ?? "") && e.innerText.length < 80).sort((a, b) => a.innerText.length - b.innerText.length)[0];
      let e = hit;
      while (e && e !== document.body && !isCard(e)) e = e.parentElement;
      for (let p = e?.parentElement; p && p !== document.body && isCard(p) && Math.abs(p.getBoundingClientRect().width - e.getBoundingClientRect().width) <= 8; p = p.parentElement) e = p;
      if (e && e !== document.body && mode === "people") {
        for (const img of e.querySelectorAll("img, svg image, [style*='background-image']")) {
          let row = img.parentElement;  // the row: the nearest ancestor that also holds text
          while (row && row !== e && (row.innerText ?? "").trim().length < 2) row = row.parentElement;
          img.style.filter = "blur(7px)";
          if (row && row !== e) for (const ch of row.querySelectorAll("*")) if (ch.children.length === 0 && ch.innerText?.trim() && !numeric(ch.innerText.trim())) ch.style.filter = "blur(7px)";
        }
        continue;
      }
      // blur the card's contents but keep its title readable
      if (e && e !== document.body) for (const ch of e.querySelectorAll("*")) if (!ch.contains(hit) && !hit.contains(ch) && ch.children.length === 0) ch.style.filter = "blur(7px)";
    }
  }, [...cards, ...people]);
  const txt = [...(CFG.blurText ?? []), ...(job.blurText ?? [])];
  if (txt.length) await page.evaluate((pats) => {
    const res = pats.map((p) => new RegExp(p, "i"));
    for (const e of document.querySelectorAll("body *")) {
      const own = [...e.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join("").trim();
      if (own && res.some((r) => r.test(own))) e.style.filter = "blur(7px)";
    }
  }, txt);
  if (CFG.hideSelectors?.length) await page.addStyleTag({ content: `${CFG.hideSelectors.join(",")}{display:none!important} *{scroll-behavior:auto!important}` });
  // consent dialogs and chat widgets often re-mount after navigation: hide fixed boxes containing these words
  await page.evaluate((words) => {
    const re = words.length ? new RegExp(words.join("|"), "i") : null;
    if (!re) return;
    // fixed / sticky / absolute boxes (banners, popovers, promo cards) whose text matches — never a big page region
    for (const e of document.querySelectorAll("body *")) {
      const pos = getComputedStyle(e).position, r = e.getBoundingClientRect();
      if (["fixed", "sticky", "absolute"].includes(pos) && r.width * r.height < innerWidth * innerHeight * 0.6 && re.test(e.innerText)) e.style.display = "none";
    }
  }, CFG.hideFixedText ?? []);
}

const rectsOf = (page, q) => page.evaluate((q) => {
  const box = (e) => { const r = e.getBoundingClientRect(); const a = e.closest("a"); return [...[r.x, r.y + scrollY, r.width, r.height].map(Math.round), ...(a ? [a.getAttribute("href")] : [])]; };
  // visible and horizontally on the page (marquees park copies far off to the side)
  const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.right > 0 && r.left < innerWidth; };
  if (q.startsWith("css:")) return [...document.querySelectorAll(q.slice(4))].filter(vis).slice(0, 14).map(box);
  const text = [...document.querySelectorAll("a,button,[role=tab],h1,h2,h3,h4,span,div,p,td,li,label")].filter(vis);
  if (q.startsWith("card:")) {
    const re = new RegExp(q.slice(5), "i");
    let e = text.filter((x) => re.test(x.innerText.trim())).sort((a, b) => a.innerText.length - b.innerText.length)[0];
    const isCard = (x) => { const c = getComputedStyle(x); return x.getBoundingClientRect().width > 150 && (parseFloat(c.borderTopWidth) > 0 || !/rgba\(0, 0, 0, 0\)|transparent/.test(c.backgroundColor)); };
    while (e && e !== document.body && !isCard(e)) e = e.parentElement;
    // a filled title bar inside a card is card-like too: keep climbing while the parent is a card of the same width
    for (let p = e?.parentElement; p && p !== document.body && isCard(p) && Math.abs(p.getBoundingClientRect().width - e.getBoundingClientRect().width) <= 8; p = p.parentElement) e = p;
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
const failed = [];
const before = existsSync(RECTS) ? JSON.parse(readFileSync(RECTS, "utf8")) : {};
for (const job of CFG.pages.filter((p) => !ONLY || ONLY.includes(p.name))) {
  const page = await ctx.newPage();
  try {
    await page.goto(BASE + job.path, { waitUntil: "load", timeout: 60000 });
    if (job.waitFor) await page.waitForSelector(job.waitFor, { timeout: 30000 });
    await hideOverlays(page, job);
    if (job.click) {
      // the shot shows the state a real click on this control produces: "css:…", else a tab / button with that text
      // inside main (not the nav or footer link of the same name), then exact text, then partial text
      const inMain = page.locator("main").getByRole("tab", { name: job.click }).or(page.locator("main").getByRole("button", { name: job.click, exact: true }));
      const target = job.click.startsWith("css:") ? page.locator(job.click.slice(4)).first()
        : (await inMain.count()) ? inMain.first()
        : (await page.getByText(job.click, { exact: true }).count()) ? page.getByText(job.click, { exact: true }).first()
        : page.getByText(job.click).first();
      const before = new URL(page.url()).pathname;
      await target.click({ timeout: 15000 });
      await page.waitForLoadState("load");
      await page.waitForTimeout(2000);
      // a tab click that lands on another page hit a same-named link (nav, footer): say so, don't film it as the tab
      const after = new URL(page.url()).pathname;
      if (after !== before && !job.leaves) throw new Error(`click "${job.click}" left ${before} for ${after} — it hit a link, not the tab. Use "click": "css:main [role=tab]:has-text('…')" (or "leaves": true if leaving is intended)`);
    }
    await settle(page);                 // data loads first, so inner panels actually overflow…
    await unrollScrollers(page);       // …then unroll them…
    await settle(page);                // …and scroll the now-tall page so its lazy parts load too
    await hideOverlays(page, job);
    out[job.name] = { h: await page.evaluate(() => document.body.scrollHeight), url: page.url() };
    // a signed-in page that bounced to a login screen films the wrong thing — say so loudly
    const gated = /login|signin|sign-in|oauth|auth\b/i.test(new URL(page.url()).pathname + new URL(page.url()).search)
      || await page.evaluate(() => !!document.querySelector("input[type=password]") || /^(sign|log) ?in/i.test(document.querySelector("h1")?.innerText ?? "")
        // in-page gates: "Log in to continue", a sign-in dialog, OAuth-only buttons
        || /(log|sign) ?in to (continue|view|see|access)|continue with (discord|google|github|apple|microsoft)|sign in with (discord|google|github|apple)/i.test(document.body.innerText));
    if (gated) {
      const why = CFG.cookies?.length ? "the session in \"cookies\" has expired or was logged out — ask the user for a fresh one" : "add a session in \"cookies\" (see SKILL step 3)";
      // never overwrite a good signed-in shot with a login screen: keep the old shot and rects, fail this page
      if (before[job.name] && !before[job.name].needsLogin && existsSync(`public/pages/${job.name}.png`)) {
        delete out[job.name];
        throw new Error(`landed on a login screen — ${why}; kept the previous shot`);
      }
      out[job.name].needsLogin = true; console.warn(`⚠ ${job.name}: landed on a login screen (${page.url()}) — ${why}`);
    }
    for (const q of job.queries ?? []) {
      // one bad selector shouldn't throw away the whole shoot
      try { out[job.name][q] = await rectsOf(page, q); } catch (e) { out[job.name][q] = []; console.warn(`⚠ ${job.name}: query ${JSON.stringify(q)} failed — ${e.message.split("\n")[0]}`); }
    }
    // full page, but capped: docs pages run to 30 000+ px and nothing below ~3 200 px is ever filmed (raise with "tall")
    const capH = Math.min(out[job.name].h, (job.tall ? job.tall / 2 : 3200));
    await page.screenshot({ path: `public/pages/${job.name}.png`, fullPage: true, clip: { x: 0, y: 0, width: (CFG.viewport ?? { width: 1440 }).width, height: capH } });
    console.log(`${job.name.padEnd(18)} ${out[job.name].h}px  ${page.url()}`);
  } catch (e) {
    // one broken page (a click that misses, a timeout) must not lose every other page's shots and rects
    console.warn(`⚠ ${job.name}: ${e.message.split("\n")[0]}`);
    failed.push(job.name);
  } finally {
    await page.close();
  }
}
if (failed.length) console.warn(`⚠ failed pages: ${failed.join(", ")} — fix their config and re-run with ONLY=${failed.join(",")}`);
const prev = ONLY ? before : Object.fromEntries(failed.filter((k) => before[k]).map((k) => [k, before[k]]));
// drop pages that are no longer in the config, so stale shots can't be filmed or flagged
const live = new Set(CFG.pages.map((p) => p.name));
const merged = Object.fromEntries(Object.entries({ ...prev, ...out }).filter(([k]) => live.has(k)));
writeFileSync(RECTS, JSON.stringify(merged, null, 1));
await browser.close();

// Shared building blocks. Every scene is a camera flying over real screenshots of the product ("pages",
// captured by scripts/capture.mjs) with live overlays (cursor, lifted cards, ticking numbers) placed in
// page CSS px, so what moves on screen is always the product's own UI.
import React, { createContext, useContext } from "react";
import { CameraMotionBlur } from "@remotion/motion-blur";
import { AbsoluteFill, Easing, Img, continueRender, delayRender, interpolate, staticFile, useCurrentFrame } from "remotion";
import RECTS from "../project/rects.json";
import { BRAND } from "../project/brand";

export const FPS = 60;
export const sec = (s: number) => Math.round(s * FPS);
export type Rect = [number, number, number, number];
type Hit = (number | string)[]; // [x, y, w, h, href?] in page CSS px
const RX = RECTS as unknown as Record<string, Record<string, Hit[]>>;

/** A measured rect: rect("home", "css:aside a", 3). Throws with the available keys when a capture is missing. */
export const rect = (page: string, query: string, i = 0): Rect => {
  const hit = RX[page]?.[query]?.[i];
  if (!hit) throw new Error(`rects.json has no ${page} › ${query} [${i}]. Known: ${Object.keys(RX[page] ?? RX).join(", ")}`);
  return hit.slice(0, 4) as Rect;
};
/** Where a click on that rect really navigates (for checking a tour shows the right next page). */
export const href = (page: string, query: string, i = 0) => RX[page]?.[query]?.[i]?.[4] as string | undefined;
export const pageHeight = (page: string) => (RX[page] as unknown as { h: number })?.h;

export const C = BRAND.colors;
export const FONT = `${BRAND.font.family}, system-ui, sans-serif`;

const fontWait = delayRender("brand font");
// no format() hint: Google Fonts may hand out TTF data under any extension, the browser sniffs it
const face = new FontFace(BRAND.font.family, `url(${staticFile(BRAND.font.file)})`, { weight: BRAND.font.weights });
face.load().then(() => { document.fonts.add(face); continueRender(fontWait); }, () => continueRender(fontWait));

export const out = Easing.bezier(0.16, 1, 0.3, 1);
export const inout = Easing.bezier(0.65, 0, 0.35, 1);
export const lerp = (f: number, i: number[], o: number[], easing = out) =>
  interpolate(f, i, o, { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing });
const keyed = <K extends string>(f: number, keys: [number, Partial<Record<K, number>>][], k: K, d: number) =>
  keys.length === 1 ? keys[0][1][k] ?? d
    : interpolate(f, keys.map((x) => x[0]), keys.map((x) => x[1][k] ?? d), { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: inout });

// Near-black like the site; the camera keeps pages filling the frame so little of it shows.
export const Bg: React.FC = () => (
  <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 45%, #111419 0%, ${C.bg} 60%, #050608 100%)` }} />
);

// Soft blur-dip between scenes; `black` = plain fade through black (intro / ending).
export const Scene: React.FC<{ dur: number; children: React.ReactNode; inF?: number; outF?: number; black?: boolean }> = ({ dur, children, inF = 16, outF = 14, black }) => {
  const f = useCurrentFrame();
  const a = lerp(f, [0, inF], [0, 1], Easing.inOut(Easing.quad));
  const b = lerp(f, [dur - outF, dur], [1, 0], Easing.inOut(Easing.quad));
  const v = Math.min(a, b);
  if (black) return <AbsoluteFill style={{ opacity: v }}>{children}</AbsoluteFill>;
  return (
    <AbsoluteFill style={{ opacity: v, filter: v < 1 ? `blur(${(1 - v) * 18}px)` : undefined, transform: `scale(${1 + (1 - a) * 0.05 - (1 - b) * 0.03})` }}>
      {children}
    </AbsoluteFill>
  );
};

// ---- Stage: camera over a page -------------------------------------------------------------
type Cam = { fx: number; fy: number; z: number; rx: number; ry: number; rz: number };
const Z = createContext(1);
export const useZ = () => useContext(Z);
const page = (n: string, soft = false) => staticFile(`pages/${n}${soft ? "_soft" : ""}.jpg`);

type StageProps = { pages: [number, string][]; cam: [number, Partial<Cam>][]; soft?: [number, number][]; children?: React.ReactNode };

// Camera at frame f, averaged over ±0.25s so moves ease in and out, but never across a page switch (a hard cut).
const camAt = (f: number, pages: StageProps["pages"], cam: StageProps["cam"]) => {
  let i = 0;
  pages.forEach((p, k) => { if (f >= p[0]) i = k; });
  const lo = pages[i][0], hi = (pages[i + 1]?.[0] ?? 1e9) - 1;
  const g = (k: keyof Cam, d: number) => [-15, -10, -5, 0, 5, 10, 15].reduce((m, o) => m + keyed(Math.min(hi, Math.max(lo, f + o)), cam, k, d), 0) / 7;
  return { i, z: g("z", 1.3), fx: g("fx", 720), fy: g("fy", 450), rx: g("rx", 0), ry: g("ry", 0), rz: g("rz", 0) };
};

/** `pages`: [frame, page] switches (crossfaded). `cam`: [frame, {fx, fy, z, rx, ry, rz}] — (fx, fy) is the page
 *  CSS point kept at frame centre, z the zoom. `soft`: [frame, 0..1] focus pull on the page (lifted cards stay sharp).
 *  Camera motion blur switches on by itself whenever the frame content moves fast. */
export const Stage: React.FC<StageProps> = (props) => {
  const f = useCurrentFrame();
  const c0 = camAt(f, props.pages, props.cam), c1 = camAt(f + 1, props.pages, props.cam);
  const speed = c0.i !== c1.i ? 0 : Math.hypot((c1.fx - c0.fx) * c0.z, (c1.fy - c0.fy) * c0.z) + Math.abs(c1.z - c0.z) * 900;
  // ponytail: on/off threshold, a speed-scaled shutter would be smoother if blur ever pops
  return speed > 7 ? <CameraMotionBlur shutterAngle={180} samples={6}><StageView {...props} /></CameraMotionBlur> : <StageView {...props} />;
};

const StageView: React.FC<StageProps> = ({ pages, cam, soft, children }) => {
  const f = useCurrentFrame();
  const { i, z, fx, fy, rx, ry, rz } = camAt(f, pages, cam);
  const fade = i > 0 ? lerp(f - pages[i][0], [0, 14], [0, 1]) : 1;
  const sv = soft ? keyed(f, soft.map(([t, v]) => [t, { v }] as [number, { v: number }]), "v", 0) : 0;
  const W = 1440 * z;
  const img: React.CSSProperties = { position: "absolute", left: 0, top: 0, width: W };
  return (
    <AbsoluteFill style={{ perspective: 1900, overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg)` }}>
        <div style={{ position: "absolute", left: 960 - fx * z, top: 540 - fy * z, width: W }}>
          {fade < 1 && <Img src={page(pages[i - 1][1])} style={img} />}
          <Img src={page(pages[i][1])} style={{ ...img, opacity: fade }} />
          {sv > 0.01 && <Img src={page(pages[i][1], true)} style={{ ...img, opacity: sv }} />}
          <Z.Provider value={z}>{children}</Z.Provider>
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 75% 70% at 50% 50%, transparent 55%, rgba(5,6,8,.85) 100%)", pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};

/** Absolutely placed box in page CSS px (inside a Stage). */
export const At: React.FC<{ r: Rect | number[]; style?: React.CSSProperties; children?: React.ReactNode }> = ({ r, style, children }) => {
  const z = useZ();
  return <div style={{ position: "absolute", left: r[0] * z, top: r[1] * z, width: r[2] * z, height: r[3] * z, ...style }}>{children}</div>;
};

/** A piece of the page lifting off toward the camera (pair with Stage `soft`). */
export const Lift: React.FC<{ pg: string; r: Rect | number[]; at: number; end?: number; pop?: number; children?: React.ReactNode }> = ({ pg, r, at, end = 1e9, pop = 1.04, children }) => {
  const f = useCurrentFrame();
  const z = useZ();
  const p = Math.min(lerp(f - at, [0, 30], [0, 1], Easing.out(Easing.cubic)), lerp(f - end, [0, 20], [1, 0], Easing.inOut(Easing.cubic)));
  if (p < 0.001) return null;

  return (
    <At r={r} style={{
      backgroundImage: `url(${page(pg)})`, backgroundSize: `${1440 * z}px auto`, backgroundPosition: `${-r[0] * z}px ${-r[1] * z}px`,
      borderRadius: 12 * z, opacity: Math.min(1, p * 3), transform: `translateY(${-p * 8 * z}px) scale(${1 + (pop - 1) * p})`,
      boxShadow: `0 ${24 * p * z}px ${60 * p * z}px rgba(0,0,0,${0.65 * p})`,
    }}>
      {/* children keep page coordinates while riding along with the lift */}
      {children && <div style={{ position: "absolute", left: -r[0] * z, top: -r[1] * z }}>{children}</div>}
    </At>
  );
};

/** Covers a value on the screenshot and draws it live (counting or ticking). */
export const Num: React.FC<{ r: Rect | number[]; text: string; size?: number; weight?: number; bg?: string; color?: string }> = ({ r, text, size, weight = 700, bg = C.card, color = C.fg }) => {
  const z = useZ();
  return (
    <At r={[r[0] - 2, r[1], r[2], r[3]]} style={{ background: bg, display: "flex", alignItems: "center", fontFamily: FONT, fontWeight: weight, color, fontSize: (size ?? r[3] * 0.82) * z, fontVariantNumeric: "tabular-nums", paddingLeft: 2 * z, whiteSpace: "nowrap" }}>
      {text}
    </At>
  );
};

/** Hover tint over an element the cursor is on (the site's own hover look: a faint fill, no outline). */
export const Hl: React.FC<{ r: Rect | number[]; at: number; end?: number }> = ({ r, at, end = 1e9 }) => {
  const f = useCurrentFrame();
  const z = useZ();
  const p = Math.min(lerp(f - at, [0, 10], [0, 1]), lerp(f - end, [0, 10], [1, 0]));
  if (p < 0.001) return null;
  return <At r={r} style={{ borderRadius: 8 * z, background: `rgba(255,255,255,${0.06 * p})` }} />;
};

// ---- macOS cursor -----------------------------------------------------------------------------
const Arrow = () => <path d="M6 3.5v17.2l4.2-4.1 2.7 6.3 2.6-1.1-2.6-6.2h6z" fill="#000" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" />;
const Hand = () => (
  <path d="M11 4.2c-1 0-1.8.8-1.8 1.8v9.6l-1.4-1.5c-.7-.7-1.8-.8-2.6-.1-.7.6-.8 1.7-.2 2.5l4.3 5.8c1.2 1.6 3.1 2.5 5.1 2.5h2.6c3 0 5.4-2.4 5.4-5.4v-5.7c0-1-.8-1.8-1.8-1.8s-1.8.8-1.8 1.8v-.8c0-1-.8-1.8-1.8-1.8s-1.8.8-1.8 1.8v-.6c0-1-.8-1.8-1.8-1.8s-1.8.8-1.8 1.8V6c0-1-.8-1.8-1.8-1.8z"
    fill="#fff" stroke="#000" strokeWidth="1.3" strokeLinejoin="round" />
);
/** A click tour: from `start`, glide to each [clickFrame, x, y] (arriving 12 frames early, pointing hand over the
 *  target), click, then rest at `rest`. Returns Cursor props. Every stop must be a real, clickable target. */
export const tour = (start: [number, number, number], stops: [number, number, number][], rest?: [number, number, number]) => {
  const path: [number, number, number, boolean?][] = [start];
  for (const [c, x, y] of stops) path.push([c - 12, x, y, true], [c + 6, x, y, true], [c + 7, x, y]);
  if (rest) path.push(rest);
  return { path, clicks: stops.map((s) => s[0]) };
};

/** path: [frame, x, y, hand?] stops in page CSS px; clicks: frames. */
export const Cursor: React.FC<{ path: [number, number, number, boolean?][]; clicks?: number[]; size?: number }> = ({ path, clicks = [], size = 30 }) => {
  const f = useCurrentFrame();
  const z = useZ();
  const fr = path.map((p) => p[0]);
  const o = { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: inout } as const;
  const x = interpolate(f, fr, path.map((p) => p[1]), o), y = interpolate(f, fr, path.map((p) => p[2]), o);
  let hand = false;
  path.forEach((p) => { if (f >= p[0]) hand = !!p[3]; });
  const press = clicks.reduce((m, c) => Math.max(m, 1 - Math.min(1, Math.abs(f - c) / 5)), 0);
  const last = clicks.filter((c) => c <= f).pop();
  const rp = last === undefined ? 1 : lerp(f - last, [0, 22], [0, 1]);
  const show = lerp(f - path[0][0], [0, 8], [0, 1]);
  const s = size * z;
  return (
    <>
      {rp < 1 && <div style={{ position: "absolute", left: x * z - 28 * z * rp, top: y * z - 28 * z * rp, width: 56 * z * rp, height: 56 * z * rp, borderRadius: "50%", border: `${2 * z}px solid rgba(255,255,255,${0.7 * (1 - rp)})`, background: `rgba(95,130,255,${0.18 * (1 - rp)})` }} />}
      <svg viewBox="0 0 28 28" width={s} height={s} style={{
        position: "absolute", left: x * z - (hand ? 11 : 6) * (s / 28), top: y * z - (hand ? 4 : 3.5) * (s / 28), opacity: show,
        transform: `scale(${1 - press * 0.15})`, transformOrigin: "30% 15%", filter: `drop-shadow(0 ${2 * z}px ${3 * z}px rgba(0,0,0,.45))`,
      }}>{hand ? <Hand /> : <Arrow />}</svg>
    </>
  );
};

// ---- Type ---------------------------------------------------------------------------------------
/** Words appear exactly when spoken: [seconds from `at`, word]. *word* = bold accent. */
export const Say: React.FC<{ words: [number, string][]; at: number; size?: number; style?: React.CSSProperties }> = ({ words, at, size = 92, style }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ fontFamily: FONT, fontSize: size, color: C.fg, letterSpacing: "-0.02em", lineHeight: 1.1, display: "flex", flexWrap: "wrap", gap: `0 ${size * 0.25}px`, textShadow: "0 4px 40px rgba(0,0,0,.6)", ...style }}>
      {words.map(([t, w], i) => {
        const p = lerp(f - at - sec(t) + 3, [0, 14], [0, 1]);
        const bold = w.startsWith("*");
        return (
          <span key={i} style={{ display: "inline-block", fontWeight: bold ? 800 : 300, opacity: p, transform: `translateY(${(1 - p) * size * 0.35}px)`, filter: p < 1 ? `blur(${(1 - p) * 12}px)` : undefined }}>
            {w.replace(/\*/g, "")}
          </span>
        );
      })}
    </div>
  );
};

/** Label tab hanging from the top edge of the frame (reference-style section title). */
export const TopTab: React.FC<{ text: string; at?: number }> = ({ text, at = 0 }) => {
  const f = useCurrentFrame();
  const p = lerp(f - at, [0, 20], [0, 1]);
  return (
    <AbsoluteFill style={{ alignItems: "center", pointerEvents: "none" }}>
      <div style={{
        padding: "16px 40px 18px", borderRadius: "0 0 22px 22px", fontFamily: FONT, fontWeight: 650, fontSize: 32, color: C.fg,
        background: "rgba(16,18,23,.94)", borderBottom: "1px solid rgba(255,255,255,.08)", boxShadow: "0 18px 50px rgba(0,0,0,.55)",
        transform: `translateY(${(p - 1) * 90}px)`,
      }}>{text}</div>
    </AbsoluteFill>
  );
};

export const fmt = (n: number) => n.toLocaleString("en-US");
export const count = (f: number, at: number, dur: number, to: number, from = 0) => Math.round(lerp(f - at, [0, dur], [from, to], Easing.out(Easing.cubic)));
// Deterministic wobble so "live" numbers keep ticking.
export const live = (f: number, base: number, amp: number) => Math.round(base + Math.sin(f * 0.05) * amp + Math.sin(f * 0.23) * amp * 0.3);

/** The product's logo mark (public/brand/…). `p` 0→1 animates it in (scale + tilt settle). */
export const LogoMark: React.FC<{ size: number; p?: number }> = ({ size, p = 1 }) => (
  <Img src={staticFile(BRAND.logo.file)} style={{ width: size, height: size, objectFit: "contain", transform: `rotate(${BRAND.logo.tilt * p - 30 * (1 - p)}deg) scale(${0.85 + 0.15 * p})` }} />
);

export const Card: React.FC<{ style?: React.CSSProperties; children: React.ReactNode }> = ({ style, children }) => (
  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, boxShadow: "0 30px 90px rgba(0,0,0,.6)", fontFamily: FONT, color: C.fg, ...style }}>{children}</div>
);

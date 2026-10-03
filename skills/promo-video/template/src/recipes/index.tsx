// Reusable scenes. Times in props are SECONDS from the scene start (converted with sec()); rects are page CSS px
// from rect(). Each recipe follows the skill's references/STYLE.md: one slow camera move per page, real clicks only, lifts cut
// out the exact card, every big word on screen is spoken.
import React from "react";
import { AbsoluteFill, Easing, random, useCurrentFrame } from "remotion";
import { BRAND } from "../project/brand";
import { At, C, CAPTION_FONT, Card, Cursor, FONT, Label, Lift, LogoMark, Num, Rect, Say, Stage, count, fmt, lerp, live, sec, tour } from "../kit";
import { DIRECTION as D } from "../project/direction";

export type Cam = { fx?: number; fy?: number; z?: number; rx?: number; ry?: number; rz?: number };
export type Words = [number, string][];
const center: React.CSSProperties = { alignItems: "center", justifyContent: "center" };
export const mid = (r: number[]) => [r[0] + r[2] / 2, r[1] + r[3] / 2] as const;
const keys = (k: [number, Cam][]) => k.map(([t, c]) => [sec(t), c] as [number, Cam]);
export const Shade: React.FC<{ o?: number }> = ({ o = 0.6 }) => <AbsoluteFill style={{ background: `radial-gradient(ellipse at center, rgba(5,6,8,${o}) 0%, rgba(5,6,8,${o * 0.5}) 60%, rgba(5,6,8,${o * 0.2}) 100%)` }} />;
// strong enough that a caption stays readable over a page's own big headline
export const BottomShade = () => <AbsoluteFill style={{ background: "linear-gradient(0deg, rgba(5,6,8,.96) 0%, rgba(5,6,8,.82) 30%, rgba(5,6,8,.35) 55%, transparent 72%)" }} />;

/** Opens and closes the video (fade via Scene { black }): the logo mark lit out of black, or — for `intro:
 *  "wordmark"` looks — the mark with the product name typing in beside it. */
export const IconReveal: React.FC = () => {
  const f = useCurrentFrame();
  if (D.intro === "wordmark") {
    const p = lerp(f - 6, [0, 36], [0, 1], Easing.out(Easing.cubic));
    const name = BRAND.name;
    const shown = Math.floor(lerp(f - 22, [0, 34], [0, name.length], Easing.linear));
    return (
      <AbsoluteFill style={{ background: "#000", ...center }}>
        <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 50%, ${C.primary}2e 0%, transparent 50%)`, opacity: p }} />
        <div style={{ display: "flex", alignItems: "center", gap: 34, opacity: p }}>
          <LogoMark size={120} p={p} />
          <div style={{ fontFamily: CAPTION_FONT, fontWeight: 800, fontSize: 112, color: C.fg, letterSpacing: "0.01em", minWidth: 40 }}>
            {name.slice(0, shown)}<span style={{ display: "inline-block", width: 6, height: 96, marginLeft: 8, verticalAlign: "-8%", background: C.primary, opacity: f % 40 < 24 ? 1 : 0 }} />
          </div>
        </div>
      </AbsoluteFill>
    );
  }
  const light = lerp(f, [0, 70], [0, 1], Easing.inOut(Easing.cubic));
  const p = lerp(f - 10, [0, 50], [0, 1], Easing.out(Easing.cubic));
  return (
    <AbsoluteFill style={{ background: "#000", ...center }}>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 50%, ${C.primary}47 0%, ${C.primary}1a 22%, transparent 55%)`, opacity: light }} />
      <div style={{ filter: `brightness(${0.15 + 0.85 * light}) drop-shadow(0 0 ${60 * light}px ${C.primary}8c)` }}>
        <LogoMark size={230} p={p} />
      </div>
    </AbsoluteFill>
  );
};

/** "Meet NAME." — logo + wordmark over the softened home page; lands on a music hit. */
export const LogoReveal: React.FC<{ dur: number; page?: string }> = ({ dur, page = "home" }) => {
  const f = useCurrentFrame();
  const p = lerp(f, [0, 30], [0, 1], Easing.out(Easing.cubic));
  const flash = lerp(f, [0, 3, 34], [0, 0.35, 0]);
  return (
    <AbsoluteFill>
      <Stage pages={[[0, page]]} soft={[[0, 1]]} cam={[[0, { fx: 720, fy: 400, z: 1.15 }], [dur, { fx: 720, fy: 380, z: 1.2 }]]} />
      <Shade o={0.8} />
      <AbsoluteFill style={{ background: C.primary, opacity: flash }} />
      <AbsoluteFill style={center}>
        <div style={{ display: "flex", alignItems: "center", gap: 40, transform: `scale(${0.85 + p * 0.15})`, opacity: p }}>
          <LogoMark size={160} p={p} />
          <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 150, color: C.fg, letterSpacing: "0.03em" }}>{BRAND.name}</div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Camera glide over one page (music-only stretches, establishing shots). */
export const Glide: React.FC<{ dur: number; page: string; from: Cam; to: Cam; children?: React.ReactNode }> = ({ dur, page, from, to, children }) => (
  <Stage pages={[[0, page]]} cam={[[0, from], [dur, to]]}>{children}</Stage>
);

type Place = "bottom-left" | "center" | "left-column" | "lower-third";
/** Words placed the way the look places captions (bottom-left, centre, left editorial column, lower-third bar). */
export const Placed: React.FC<{ words: Words; at: number; place?: Place; size?: number }> = ({ words, at, place = D.caption.position, size }) => {
  const sz = size ?? (place === "center" ? Math.round(D.caption.size * 1.25) : D.caption.size);
  if (place === "center") return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <Shade o={0.75} />
      <AbsoluteFill style={center}><Say at={sec(at)} size={sz} words={words} style={{ maxWidth: 1560, justifyContent: "center", textAlign: "center" }} /></AbsoluteFill>
    </AbsoluteFill>
  );
  if (place === "left-column") return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill style={{ background: "linear-gradient(90deg, rgba(5,6,8,.94) 0%, rgba(5,6,8,.82) 34%, rgba(5,6,8,.3) 52%, transparent 66%)" }} />
      <AbsoluteFill style={{ justifyContent: "center", padding: "0 0 0 120px" }}><Say at={sec(at)} size={sz} words={words} style={{ maxWidth: 720, lineHeight: 1.12 }} /></AbsoluteFill>
    </AbsoluteFill>
  );
  if (place === "lower-third") return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill style={{ background: "linear-gradient(0deg, rgba(5,6,8,.94) 0%, rgba(5,6,8,.7) 22%, transparent 42%)" }} />
      <AbsoluteFill style={{ justifyContent: "flex-end", padding: "0 120px 86px" }}>
        <div style={{ display: "flex", gap: 26, alignItems: "stretch" }}>
          <div style={{ width: 6, borderRadius: 3, background: C.primary, boxShadow: `0 0 18px ${C.primary}` }} />
          <Say at={sec(at)} size={sz} words={words} style={{ maxWidth: 1500 }} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <BottomShade />
      <AbsoluteFill style={{ justifyContent: "flex-end", padding: "0 120px 100px" }}><Say at={sec(at)} size={sz} words={words} style={{ maxWidth: 1600 }} /></AbsoluteFill>
    </AbsoluteFill>
  );
};

/** A spoken line as the scene itself, over a softened page. `bottom` = place it like the look's captions;
 *  otherwise it's a statement: centred, or in the left column for column looks. */
export const Spoken: React.FC<{ dur: number; page: string; words: Words; at: number; size?: number; bottom?: boolean; cam?: Cam }> = ({ dur, page, words, at, size, bottom, cam = { fx: 720, fy: 420, z: 1.3 } }) => (
  <AbsoluteFill>
    <Stage pages={[[0, page]]} soft={[[0, 1]]} cam={[[0, cam], [dur, { ...cam, z: (cam.z ?? 1.3) + 0.12 }]]} />
    {/* a statement scene: centred, or a larger line in the left column for column looks */}
    <Placed words={words} at={at} place={bottom ? D.caption.position : D.caption.position === "left-column" ? "left-column" : "center"}
      size={size ?? (!bottom && D.caption.position === "left-column" ? Math.round(D.caption.size * 1.45) : undefined)} />
  </AbsoluteFill>
);

export type Click = { at: number; r: Rect | number[]; to?: string };
/** The workhorse: a page the cursor really uses. Each click switches to the page that link opens (`to`).
 *  Keep `cam` to 2–3 slow stops that frame every click target; lifts pull exact cards forward. */
export const Tour: React.FC<{
  dur: number; page: string; cam: [number, Cam][]; clicks?: Click[]; start?: [number, number]; rest?: [number, number];
  lifts?: { pg?: string; r: Rect | number[]; at: number; end?: number; live?: { r: Rect | number[]; base: number; amp?: number } }[];
  soft?: [number, number][]; label?: string; n?: number; children?: React.ReactNode;
}> = ({ dur, page, cam, clicks = [], start, rest, lifts = [], soft, label, n, children }) => {
  const f = useCurrentFrame();
  const pages: [number, string][] = [[0, page], ...clicks.filter((c) => c.to).map((c) => [sec(c.at) + 4, c.to!] as [number, string])];
  const pageAt = (fr: number) => pages.filter((p) => p[0] <= fr).pop()![1];
  const first = clicks[0] ? mid(clicks[0].r) : [720, 450];
  const t = tour([0, ...(start ?? [first[0] + 140, first[1] + 90])] as [number, number, number],
    clicks.map((c) => [sec(c.at), ...mid(c.r)] as [number, number, number]), rest ? [dur, ...rest] : undefined);
  return (
    <AbsoluteFill>
      <Stage pages={pages} cam={keys(cam)} soft={soft?.map(([s, v]) => [sec(s), v])}>
        {lifts.map((l, i) => (
          <Lift key={i} pg={l.pg ?? pageAt(sec(l.at))} r={l.r} at={sec(l.at)} end={l.end === undefined ? undefined : sec(l.end)}>
            {l.live && <Num r={l.live.r} text={fmt(live(f, l.live.base, l.live.amp ?? Math.max(3, l.live.base * 0.002)))} />}
          </Lift>
        ))}
        {children}
        {clicks.length > 0 && <Cursor {...t} />}
      </Stage>
      {label && <Label text={label} at={6} n={n} />}
    </AbsoluteFill>
  );
};

/** Values on the page counting up / ticking live (numbers the voice is reading out). */
export const Counters: React.FC<{ dur: number; page: string; cam: [number, Cam][]; nums: { r: Rect | number[]; to: number; at?: number; dur?: number; live?: number }[]; label?: string; n?: number }> = ({ dur, page, cam, nums, label, n }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Stage pages={[[0, page]]} cam={keys(cam)}>
        {nums.map((n, i) => (
          <Num key={i} r={n.r} text={fmt(n.at === undefined ? live(f, n.to, n.live ?? n.to * 0.0002) : count(f, sec(n.at), sec(n.dur ?? 1.4), n.to))} />
        ))}
      </Stage>
      {label && <Label text={label} at={6} n={n} />}
    </AbsoluteFill>
  );
};

/** Typing queries into the site's real input, then clicking its real button (lands on a beat / drop). */
export const Typing: React.FC<{ dur: number; page: string; input: Rect | number[]; button: Rect | number[]; queries: { text: string; from: number; to: number }[]; focusAt: number; clickAt: number; cam: [number, Cam][]; fontScale?: number }> = ({ dur, page, input, button, queries, focusAt, clickAt, cam, fontScale = 2.1 }) => {
  const f = useCurrentFrame();
  const active = [...queries].reverse().find((q) => f >= sec(q.from) - 4) ?? queries[0];
  const q = active.text.slice(0, Math.floor(lerp(f, [sec(active.from), sec(active.to)], [0, active.text.length], Easing.linear)));
  const typing = queries.some((x) => f >= sec(x.from) && f <= sec(x.to) + 6);
  const caret = f >= sec(focusAt) && (typing || f % 50 < 28);
  const c = tour([0, input[0] + input[2] * 0.6, input[1] + 120], [[sec(focusAt), input[0] + 60, mid(input)[1]], [sec(clickAt), ...mid(button)]]);
  // while typing, the pointer waits in empty space above-right of the button (never resting on another control)
  c.path.splice(4, 0, [sec(focusAt) + 30, button[0] + button[2] + 90, button[1] - 60], [sec(clickAt) - 40, button[0] + button[2] + 70, button[1] - 50]);
  return (
    <Stage pages={[[0, page]]} cam={keys(cam)}>
      <At r={[input[0] + 6, input[1] + 6, input[2] - 12, input[3] - 12]} style={{ background: C.bg }} />
      <At r={input} style={{ borderRadius: 20, boxShadow: f >= sec(focusAt) ? `0 0 0 2px ${C.primary}, 0 0 0 6px ${C.primary}29` : undefined }} />
      <At r={[input[0] + 14, input[1], input[2] - 20, input[3]]} style={{ display: "flex", alignItems: "center", fontFamily: FONT, color: C.fg }}>
        <span style={{ fontSize: `${fontScale}em`, whiteSpace: "pre" }}>{q}</span>
        <span style={{ width: 4, height: "45%", marginLeft: 3, background: caret ? C.fg : "transparent" }} />
      </At>
      <Cursor {...c} />
    </Stage>
  );
};

/** Notification toasts sliding in on the right (account / alert features). Screen px, not page px. */
export const Toasts: React.FC<{ items: { at: number; title: string; body: string }[] }> = ({ items }) => {
  const f = useCurrentFrame();
  return (
    <>
      {items.map((t, i) => {
        const p = lerp(f - sec(t.at), [0, 26], [0, 1], Easing.out(Easing.cubic));
        return (
          <Card key={i} style={{ position: "absolute", right: 110, top: 240 + i * 180, width: 660, padding: "24px 28px", display: "flex", gap: 22, alignItems: "center", opacity: p, transform: `translateX(${(1 - p) * 420}px)` }}>
            <LogoMark size={60} />
            <div>
              <div style={{ fontSize: 30, fontWeight: 750 }}>{t.title}</div>
              <div style={{ fontSize: 25, color: C.dim, marginTop: 4 }}>{t.body}</div>
            </div>
          </Card>
        );
      })}
    </>
  );
};

/** Closing card: logo + name, the spoken tagline, then the URL pill when it is said. */
export const Outro: React.FC<{ at: number; words: Words; urlAt: number }> = ({ at, words, urlAt }) => {
  const f = useCurrentFrame();
  const p = lerp(f, [0, 30], [0, 1], Easing.out(Easing.cubic));
  const u = lerp(f - sec(urlAt), [0, 24], [0, 1], Easing.out(Easing.cubic));
  return (
    <AbsoluteFill style={{ ...center, flexDirection: "column", gap: 34 }}>
      <div style={{ position: "absolute", width: 1200, height: 900, borderRadius: "50%", background: `radial-gradient(ellipse, ${C.primary}29 0%, transparent 65%)` }} />
      <div style={{ display: "flex", alignItems: "center", gap: 36, transform: `scale(${0.88 + p * 0.12})`, opacity: p }}>
        <LogoMark size={140} p={p} />
        <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 130, color: C.fg, letterSpacing: "0.03em" }}>{BRAND.name}</div>
      </div>
      <Say at={sec(at)} size={62} style={{ color: C.dim }} words={words} />
      <div style={{ marginTop: 16, padding: "22px 46px", borderRadius: 999, background: C.primary, fontFamily: FONT, fontSize: 48, fontWeight: 750, color: "#fff", boxShadow: `0 0 70px ${C.primary}73`, opacity: u, transform: `translateY(${(1 - u) * 30}px)` }}>
        {BRAND.url}
      </div>
    </AbsoluteFill>
  );
};

import VO_DATA from "../project/vo.json";
const LINES = VO_DATA as unknown as Record<string, { dur: number; words: [number, string][] }>;
/** Word timings of a voice line (written by scripts/tts.py from whisper, using the script's own spelling).
 *  `bold` words are drawn heavy; `from`/`to` keep only part of the line (by word index). */
export const words = (id: string, bold: string[] = [], from = 0, to?: number): Words => {
  const w = LINES[id]?.words;
  if (!w) throw new Error(`vo.json has no line ${id} — run scripts/tts.py`);
  const norm = (x: string) => x.toLowerCase().replace(/[^\p{L}\p{N}']/gu, "");
  const b = new Set(bold.map(norm)); // "minute." and "minute" both match
  return w.slice(from, to).map(([t, s]) => [t, b.has(norm(s)) ? `*${s}*` : s]);
};

/** A chart on the page draws itself left→right, then a dot + label pop on its REAL peak.
 *  plot / peak come from `scripts/measure.py chart <page> x y w h` (CSS px). `bg` = the chart card colour. */
export const ChartReveal: React.FC<{ dur: number; page: string; plot: number[]; peak?: number[]; peakLabel?: string; drawFrom?: number; drawTo: number; labelAt?: number; cam: [number, Cam][]; label?: string; n?: number; bg?: string }> = ({ page, plot, peak, peakLabel, drawFrom = 0.1, drawTo, labelAt, cam, label, n, bg = C.card }) => {
  const f = useCurrentFrame();
  const wipe = lerp(f, [sec(drawFrom), sec(drawTo)], [0, 1], Easing.inOut(Easing.cubic));
  const x = plot[0] + plot[2] * wipe;
  const rp = labelAt === undefined ? 0 : lerp(f - sec(labelAt), [0, 22], [0, 1], Easing.out(Easing.cubic));
  return (
    <AbsoluteFill>
      <Stage pages={[[0, page]]} cam={keys(cam)}>
        {wipe < 1 && <At r={[x, plot[1], plot[0] + plot[2] - x + 4, plot[3]]} style={{ background: bg }} />}
        {wipe > 0 && wipe < 1 && <At r={[x - 1.5, plot[1], 3, plot[3]]} style={{ background: C.primarySoft, boxShadow: `0 0 24px 6px ${C.primary}` }} />}
        {peak && rp > 0.001 && <>
          <At r={[peak[0] - 7, peak[1] - 7, 14, 14]} style={{ borderRadius: 99, background: "#fff", opacity: rp, boxShadow: `0 0 0 ${6 * rp}px ${C.primary}59, 0 0 18px ${C.primary}` }} />
          {peakLabel && <At r={[peak[0] - 110, peak[1] - 58, 220, 38]} style={{ opacity: rp, transform: `translateY(${(1 - rp) * 10}px)` }}>
            <div style={{ width: "100%", height: "100%", borderRadius: 999, background: C.primary, color: "#fff", fontFamily: FONT, fontWeight: 750, fontSize: "1.05em", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 30px rgba(0,0,0,.5)", whiteSpace: "nowrap" }}>{peakLabel}</div>
          </At>}
        </>}
      </Stage>
      {label && <Label text={label} at={6} n={n} />}
    </AbsoluteFill>
  );
};

/** Illustrative live line (data arriving point by point) under spoken type — for "how it works" lines such as
 *  "measured every minute". It draws a shape, not real numbers: keep any numbers out of its labels. */
export const LiveLine: React.FC<{ dur: number; page: string; top: Words; bottom?: Words; at: number }> = ({ dur, page, top, bottom, at }) => {
  const f = useCurrentFrame();
  const N = 110, shown = Math.min(N, f / 2.4);
  const pts = Array.from({ length: Math.floor(shown) + 1 }, (_, i) => [i * (1900 / N), 210 + Math.sin(i / 8) * 70 + random(`p${i}`) * 45 - i * 1.0] as const);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x},${y}`).join(" ");
  const last = pts[pts.length - 1];
  return (
    <AbsoluteFill>
      <Stage pages={[[0, page]]} soft={[[0, 1]]} cam={[[0, { fx: 720, fy: 330, z: 1.6 }], [dur, { fx: 760, fy: 360, z: 1.75 }]]} />
      <Shade o={0.82} />
      <AbsoluteFill style={{ ...center, perspective: 1600 }}>
        <svg width="1900" height="420" style={{ overflow: "visible", transform: `translateY(170px) rotateX(${lerp(f, [0, dur], [28, 20])}deg) translateX(${lerp(f, [0, dur], [200, -40], Easing.linear)}px)` }}>
          <defs><linearGradient id="ll" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={C.primary} stopOpacity=".35" /><stop offset="1" stopColor={C.primary} stopOpacity="0" /></linearGradient></defs>
          <path d={`${line} L${last[0]},420 L0,420 Z`} fill="url(#ll)" />
          <path d={line} fill="none" stroke={C.primary} strokeWidth="4" />
          {pts.filter((_, i) => i % 5 === 0).map(([x, y], i) => <circle key={i} cx={x} cy={y} r="6" fill={C.primarySoft} />)}
          <circle cx={last[0]} cy={last[1]} r={11 + Math.sin(f / 6) * 2} fill="#fff" style={{ filter: `drop-shadow(0 0 14px ${C.primary})` }} />
        </svg>
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 170, gap: 26 }}>
        <Say at={sec(at)} size={96} words={top} style={{ justifyContent: "center", maxWidth: 1600 }} />
        {bottom && <Say at={sec(at)} size={58} style={{ color: C.dim, justifyContent: "center", maxWidth: 1600 }} words={bottom} />}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const ICONS: Record<string, string> = {
  star: "M12 2.5l2.9 6 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.2 1.3-6.6L2.5 9.3l6.6-.8z",
  heart: "M12 20.5s-7.5-4.6-9.3-9.2C1.4 8 3.4 4.5 6.9 4.5c2 0 3.6 1.1 5.1 3 1.5-1.9 3.1-3 5.1-3 3.5 0 5.5 3.5 4.2 6.8-1.8 4.6-9.3 9.2-9.3 9.2z",
  bell: "M12 3a6 6 0 0 0-6 6v4l-2 3h16l-2-3V9a6 6 0 0 0-6-6zm-2 15a2 2 0 0 0 4 0",
  check: "M5 12.5l4.5 4.5L19 7.5",
};
/** A toggle the cursor clicks turning "on" (favourite, like, follow, subscribe): from `at`, the button area shows
 *  the filled icon + `label` in the brand colour. Put it inside a Tour/Stage; `bg` = what's behind the button. */
export const Toggle: React.FC<{ r: Rect | number[]; at: number; icon?: keyof typeof ICONS; label?: string; bg?: string }> = ({ r, at, icon = "star", label, bg = C.bg }) => {
  const f = useCurrentFrame();
  if (f < sec(at)) return null;
  const pop = lerp(f - sec(at), [0, 18], [0, 1], Easing.out(Easing.cubic));
  const stroke = icon === "check" || icon === "bell";
  return (
    <At r={[r[0] + 4, r[1] + 2, r[2] - 8, r[3] - 4]} style={{ background: bg, display: "flex", flexDirection: label ? "column" : "row", alignItems: "center", justifyContent: "center", gap: "8%", fontFamily: FONT }}>
      <svg viewBox="0 0 24 24" style={{ width: label ? "34%" : "60%", transform: `scale(${0.75 + pop * 0.25})` }}>
        <path d={ICONS[icon]} fill={stroke ? "none" : C.primary} stroke={C.primary} strokeWidth={stroke ? 2.2 : 1.5} strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      {label && <span style={{ color: C.primarySoft, fontSize: "1.3em", fontWeight: 600 }}>{label}</span>}
    </At>
  );
};

/** Spoken words as a caption over any scene, placed per the look (or `centered`). Layer it on a Tour / Stage. */
export const Caption: React.FC<{ words: Words; at: number; size?: number; centered?: boolean }> = ({ words, at, size, centered }) => (
  <Placed words={words} at={at} size={size} place={centered ? "center" : undefined} />
);

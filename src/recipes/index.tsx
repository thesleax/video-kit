// Reusable scenes. Times in props are SECONDS from the scene start (converted with sec()); rects are page CSS px
// from rect(). Each recipe follows docs/STYLE.md: one slow camera move per page, real clicks only, lifts cut
// out the exact card, every big word on screen is spoken.
import React from "react";
import { AbsoluteFill, Easing, useCurrentFrame } from "remotion";
import { BRAND } from "../project/brand";
import { At, C, Card, Cursor, FONT, Lift, LogoMark, Num, Rect, Say, Stage, TopTab, count, fmt, lerp, live, sec, tour } from "../kit";

export type Cam = { fx?: number; fy?: number; z?: number; rx?: number; ry?: number; rz?: number };
export type Words = [number, string][];
const center: React.CSSProperties = { alignItems: "center", justifyContent: "center" };
export const mid = (r: number[]) => [r[0] + r[2] / 2, r[1] + r[3] / 2] as const;
const keys = (k: [number, Cam][]) => k.map(([t, c]) => [sec(t), c] as [number, Cam]);
export const Shade: React.FC<{ o?: number }> = ({ o = 0.6 }) => <AbsoluteFill style={{ background: `radial-gradient(ellipse at center, rgba(5,6,8,${o}) 0%, rgba(5,6,8,${o * 0.5}) 60%, rgba(5,6,8,${o * 0.2}) 100%)` }} />;
export const BottomShade = () => <AbsoluteFill style={{ background: "linear-gradient(0deg, rgba(5,6,8,.92) 0%, rgba(5,6,8,.55) 32%, transparent 60%)" }} />;

/** Logo mark alone, lit out of black. Opens and closes the video (fade via Scene { black }). */
export const IconReveal: React.FC = () => {
  const f = useCurrentFrame();
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

/** Spoken line as big type over a softened page. `at` = when the voice line starts. */
export const Spoken: React.FC<{ dur: number; page: string; words: Words; at: number; size?: number; bottom?: boolean; cam?: Cam }> = ({ dur, page, words, at, size = 110, bottom, cam = { fx: 720, fy: 420, z: 1.3 } }) => (
  <AbsoluteFill>
    <Stage pages={[[0, page]]} soft={[[0, 1]]} cam={[[0, cam], [dur, { ...cam, z: (cam.z ?? 1.3) + 0.12 }]]} />
    {bottom ? <BottomShade /> : <Shade o={0.8} />}
    <AbsoluteFill style={bottom ? { justifyContent: "flex-end", padding: "0 120px 110px" } : center}>
      <Say at={sec(at)} size={size} words={words} style={{ maxWidth: 1600, justifyContent: bottom ? undefined : "center" }} />
    </AbsoluteFill>
  </AbsoluteFill>
);

export type Click = { at: number; r: Rect | number[]; to?: string };
/** The workhorse: a page the cursor really uses. Each click switches to the page that link opens (`to`).
 *  Keep `cam` to 2–3 slow stops that frame every click target; lifts pull exact cards forward. */
export const Tour: React.FC<{
  dur: number; page: string; cam: [number, Cam][]; clicks?: Click[]; start?: [number, number]; rest?: [number, number];
  lifts?: { pg?: string; r: Rect | number[]; at: number; end?: number }[]; soft?: [number, number][]; label?: string; children?: React.ReactNode;
}> = ({ dur, page, cam, clicks = [], start, rest, lifts = [], soft, label, children }) => {
  const pages: [number, string][] = [[0, page], ...clicks.filter((c) => c.to).map((c) => [sec(c.at) + 4, c.to!] as [number, string])];
  const pageAt = (fr: number) => pages.filter((p) => p[0] <= fr).pop()![1];
  const first = clicks[0] ? mid(clicks[0].r) : [720, 450];
  const t = tour([0, ...(start ?? [first[0] + 140, first[1] + 90])] as [number, number, number],
    clicks.map((c) => [sec(c.at), ...mid(c.r)] as [number, number, number]), rest ? [dur, ...rest] : undefined);
  return (
    <AbsoluteFill>
      <Stage pages={pages} cam={keys(cam)} soft={soft?.map(([s, v]) => [sec(s), v])}>
        {lifts.map((l, i) => <Lift key={i} pg={l.pg ?? pageAt(sec(l.at))} r={l.r} at={sec(l.at)} end={l.end === undefined ? undefined : sec(l.end)} />)}
        {children}
        {clicks.length > 0 && <Cursor {...t} />}
      </Stage>
      {label && <TopTab text={label} at={6} />}
    </AbsoluteFill>
  );
};

/** Values on the page counting up / ticking live (numbers the voice is reading out). */
export const Counters: React.FC<{ dur: number; page: string; cam: [number, Cam][]; nums: { r: Rect | number[]; to: number; at?: number; dur?: number; live?: number }[]; label?: string }> = ({ dur, page, cam, nums, label }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Stage pages={[[0, page]]} cam={keys(cam)}>
        {nums.map((n, i) => (
          <Num key={i} r={n.r} text={fmt(n.at === undefined ? live(f, n.to, n.live ?? n.to * 0.0002) : count(f, sec(n.at), sec(n.dur ?? 1.4), n.to))} />
        ))}
      </Stage>
      {label && <TopTab text={label} at={6} />}
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
  const b = new Set(bold.map((x) => x.toLowerCase()));
  return w.slice(from, to).map(([t, s]) => [t, b.has(s.toLowerCase().replace(/[^\p{L}\p{N}']/gu, "")) ? `*${s}*` : s]);
};

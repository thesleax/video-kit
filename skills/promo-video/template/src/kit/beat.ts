// The music's map (src/project/music.json, written by scripts/music.py analyze): bars to cut on, sections to build
// the story on, kicks the picture answers (Promo.tsx, per DIRECTION.beat).
import M from "../project/music.json";

type Section = { kind: "intro" | "build" | "drop" | "break" | "outro"; from: number; to: number; bars: number };
const P = M as unknown as { bpm?: number; bar?: number; bars?: number[]; kicks?: number[]; sections?: Section[] };
export const BARS = P.bars ?? [];
export const KICKS = P.kicks ?? [];
export const SECTIONS = P.sections ?? [];
export const BAR_LEN = P.bar ?? 2;

/** Start time of bar i (from music.json). Scene starts belong on these. */
export const bar = (i: number) => {
  if (BARS[i] === undefined) throw new Error(`music.json has no bar ${i} — run scripts/music.py analyze (bars: ${BARS.length})`);
  return BARS[i];
};
/** The n-th section of a kind: section("drop", 1).from = drop 2. Times are in the ORIGINAL track; after
 *  scripts/music.py cut, shift the ones past the cut by (B - A). */
export const section = (kind: Section["kind"], n = 0) => {
  const s = SECTIONS.filter((x) => x.kind === kind)[n];
  if (!s) throw new Error(`music.json has no ${kind} #${n + 1} — sections: ${SECTIONS.map((x) => x.kind).join(", ")}`);
  return s;
};
const inDrop = (t: number) => SECTIONS.some((s) => s.kind === "drop" && t >= s.from && t < s.to);

/** 0..1 hit envelope for second t: 1 on a kick inside a drop, decaying over ~0.12 s. `i` = which kick (for shake direction). */
export const kickAt = (t: number) => {
  let lo = 0, hi = KICKS.length - 1, k = -1;
  while (lo <= hi) { const m = (lo + hi) >> 1; if (KICKS[m] <= t) { k = m; lo = m + 1; } else hi = m - 1; }
  if (k < 0 || !inDrop(KICKS[k])) return { e: 0, i: k };
  return { e: Math.exp(-(t - KICKS[k]) / 0.06), i: k };
};
/** 0..1 flash on the first beat of each drop. */
export const dropFlash = (t: number) => SECTIONS.reduce((m, s) => s.kind === "drop" && t >= s.from ? Math.max(m, 1 - (t - s.from) / 0.3) : m, 0);

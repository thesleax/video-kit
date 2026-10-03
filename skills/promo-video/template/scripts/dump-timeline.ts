// Exports the timeline for the Python checks: public/timeline.json { end, scenes, vo: [{id, at, dur}] }.
import { readFileSync, writeFileSync } from "node:fs";
import { END, EXTRA_VO, SCENES, SFX } from "../src/project/timeline";

const lines = JSON.parse(readFileSync("src/project/vo.json", "utf8")) as Record<string, { dur: number }>;
const vo = [...SCENES.filter((s) => s.vo).map((s) => ({ id: s.vo!, at: s.at + (s.voAt ?? 0) })), ...EXTRA_VO]
  .sort((a, b) => a.at - b.at).map((v) => ({ ...v, dur: lines[v.id]?.dur ?? 0 }));
writeFileSync("public/timeline.json", JSON.stringify({ end: END, scenes: SCENES, vo, sfx: SFX }, null, 1));
// overlaps are the most common timing bug: a line still talking when the next starts
vo.forEach((v, i) => { const n = vo[i + 1]; if (n && v.at + v.dur > n.at) console.warn(`overlap: ${v.id} ends ${(v.at + v.dur).toFixed(2)}s, ${n.id} starts ${n.at}s`); });
const last = vo[vo.length - 1];
console.log(`${SCENES.length} scenes, ${vo.length} lines, speech ends ${(last.at + last.dur).toFixed(2)}s of ${END}s`);

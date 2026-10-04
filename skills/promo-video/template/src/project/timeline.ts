// The video as data: scene starts, voice lines, effects. Pure TS (no React) so scripts/dump-timeline.ts can
// export it for the Python checks. Scene components live in scenes.tsx under the same ids.
// Times are seconds. Put scene starts on beats / drops from `scripts/music.py analyze`.
export type SceneDef = { id: string; at: number; vo?: string; voAt?: number; black?: boolean; inF?: number; outF?: number };

export const SCENES: SceneDef[] = [
  { id: "intro", at: 0, black: true, inF: 1, outF: 36 },
  { id: "hook", at: 2.6, vo: "01", voAt: 0.4, black: true, inF: 36 },
  { id: "logo", at: 7.0 },
  { id: "tour", at: 10.0, vo: "03", voAt: 0.2 },
  { id: "outro", at: 16.0, vo: "04", voAt: 0.7, black: true, outF: 30 }, // voice starts after the impact
  { id: "end", at: 22.0, black: true, inF: 24, outF: 80 },
];
// Voice lines that start inside another scene (e.g. "Meet NAME." just before the logo hit).
export const EXTRA_VO: { id: string; at: number }[] = [{ id: "02", at: 6.7 }];
export const END = 26.0;
export const MUSIC = { file: "music/edit.wav", bed: "music/edit_bed.wav", base: 0.36, duck: 0.17, fadeOut: 3 };

const at = (scene: string, t: number) => SCENES.find((s) => s.id === scene)!.at + t;
/** [time, sfx name (public/sfx/<name>.mp3), volume, optional length to trim long tails] */
export const SFX: [number, string, number, number?][] = [
  [0.4, "sparkle", 0.3], [2.3, "sweep-short", 0.25], [7.0, "impact", 0.2, 1.2],
  [at("tour", -0.1), "whoosh-fast", 0.25],
  [at("outro", 0), "impact", 0.18, 0.7], [at("end", 0.2), "sparkle", 0.3],
];

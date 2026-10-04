// The engine: plays project/timeline.ts with project/scenes.tsx. Voice ducks music (~10 dB) and effects;
// `--props='{"stem":"vo"}'` renders one layer (music | vo | sfx) for scripts/mixcheck.py.
import React from "react";
import { AbsoluteFill, Audio, Sequence, getInputProps, interpolate, random, staticFile, useCurrentFrame } from "remotion";
import { Bg, Scene, sec } from "./kit";
import { dropFlash, kickAt } from "./kit/beat";
import { DIRECTION as D } from "./project/direction";
import { END, EXTRA_VO, MUSIC, SCENES, SFX } from "./project/timeline";
import { SCENE_COMPONENTS } from "./project/scenes";
import VO_DATA from "./project/vo.json";

export const TOTAL = sec(END);
const LINES = VO_DATA as unknown as Record<string, { dur: number }>;
const VO = [...SCENES.filter((s) => s.vo).map((s) => ({ id: s.vo!, at: s.at + (s.voAt ?? 0) })), ...EXTRA_VO].sort((a, b) => a.at - b.at);

// Lines closer than 1.5 s share one duck: the music must not swell up and dip again between them (audible pumping).
const DUCK = VO.map((v) => [sec(v.at), sec(v.at + (LINES[v.id]?.dur ?? 3))]).reduce<number[][]>((acc, [a, b]) => {
  const last = acc[acc.length - 1];
  if (last && a - last[1] < sec(1.5)) last[1] = Math.max(last[1], b); else acc.push([a, b]);
  return acc;
}, []);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const under = (f: number) => DUCK.reduce((m, [a, b]) => Math.max(m, interpolate(f, [a - 18, a, b, b + 45], [0, 1, 1, 0], { ...clamp, easing: (x) => x * x * (3 - 2 * x) })), 0);
const musicVolume = (f: number) => (MUSIC.base - under(f) * MUSIC.duck) * interpolate(f, [TOTAL - sec(MUSIC.fadeOut), TOTAL], [1, 0], clamp);

// the same track with the speech band carved out (scripts/music.py writes *_bed.wav); crossfaded in under the voice
const BED = (MUSIC as { bed?: string }).bed;
const stem = (getInputProps() as { stem?: string }).stem;
const on = (s: string) => !stem || stem === s;

/** The picture answering the music: zoom punch + shake on kicks inside drops, a flash into each drop (DIRECTION.beat). */
const Beat: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const f = useCurrentFrame();
  const { punch, flash, shake } = D.beat;
  const { e, i } = kickAt(f / 60);
  const fl = dropFlash(f / 60);
  const dx = shake * e * 14 * (random(`x${i}`) - 0.5), dy = shake * e * 14 * (random(`y${i}`) - 0.5);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ transform: `translate(${dx}px, ${dy}px) scale(${1 + punch * e * 0.03})` }}>{children}</AbsoluteFill>
      {flash * fl > 0.01 && <AbsoluteFill style={{ background: "#fff", opacity: flash * fl * 0.85, mixBlendMode: "screen" }} />}
    </AbsoluteFill>
  );
};

export const Promo: React.FC = () => (
  <AbsoluteFill style={{ background: "#0b0d11" }}>
    <Bg />
    <Beat>
    {SCENES.map((s, i) => {
      const dur = sec(SCENES[i + 1]?.at ?? END) - sec(s.at);
      const Comp = SCENE_COMPONENTS[s.id];
      if (!Comp) throw new Error(`scenes.tsx has no component for scene "${s.id}"`);
      return (
        <Sequence key={s.id} from={sec(s.at)} durationInFrames={dur} name={s.id}>
          <Scene dur={dur} black={s.black} inF={s.inF} outF={s.outF}><Comp dur={dur} /></Scene>
        </Sequence>
      );
    })}
    </Beat>
    {on("music") && <Audio src={staticFile(MUSIC.file)} volume={(f) => musicVolume(f) * (BED ? 1 - under(f) : 1)} />}
    {on("music") && BED && <Audio src={staticFile(BED)} volume={(f) => musicVolume(f) * under(f)} />}
    {on("vo") && VO.map((v) => <Sequence key={v.id} from={sec(v.at)} name={`vo ${v.id}`}><Audio src={staticFile(`vo/${v.id}.wav`)} /></Sequence>)}
    {on("sfx") && SFX.map(([t, f, v, len], i) => (
      <Sequence key={i} from={sec(t)} durationInFrames={len ? sec(len) : undefined} name={f}>
        {/* effects step back under the voice; trimmed ones fade over their last 0.2s */}
        <Audio src={staticFile(`sfx/${f}.mp3`)} volume={(fr) => v * (1 - 0.6 * under(sec(t))) * (len ? Math.min(1, (sec(len) - fr) / 12) : 1)} />
      </Sequence>
    ))}
  </AbsoluteFill>
);

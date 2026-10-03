// The engine: plays project/timeline.ts with project/scenes.tsx. Voice ducks music (~10 dB) and effects;
// `--props='{"stem":"vo"}'` renders one layer (music | vo | sfx) for scripts/mixcheck.py.
import React from "react";
import { AbsoluteFill, Audio, Sequence, getInputProps, interpolate, staticFile } from "remotion";
import { Bg, Scene, sec } from "./kit";
import { END, EXTRA_VO, MUSIC, SCENES, SFX } from "./project/timeline";
import { SCENE_COMPONENTS } from "./project/scenes";
import VO_DATA from "./project/vo.json";

export const TOTAL = sec(END);
const LINES = VO_DATA as unknown as Record<string, { dur: number }>;
const VO = [...SCENES.filter((s) => s.vo).map((s) => ({ id: s.vo!, at: s.at + (s.voAt ?? 0) })), ...EXTRA_VO].sort((a, b) => a.at - b.at);

const DUCK = VO.map((v) => [sec(v.at), sec(v.at + (LINES[v.id]?.dur ?? 3))] as const);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const under = (f: number) => DUCK.reduce((m, [a, b]) => Math.max(m, interpolate(f, [a - 12, a, b, b + 24], [0, 1, 1, 0], clamp)), 0);
const musicVolume = (f: number) => (MUSIC.base - under(f) * MUSIC.duck) * interpolate(f, [TOTAL - sec(MUSIC.fadeOut), TOTAL], [1, 0], clamp);

const stem = (getInputProps() as { stem?: string }).stem;
const on = (s: string) => !stem || stem === s;

export const Promo: React.FC = () => (
  <AbsoluteFill style={{ background: "#0b0d11" }}>
    <Bg />
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
    {on("music") && <Audio src={staticFile(MUSIC.file)} volume={musicVolume} />}
    {on("vo") && VO.map((v) => <Sequence key={v.id} from={sec(v.at)} name={`vo ${v.id}`}><Audio src={staticFile(`vo/${v.id}.wav`)} /></Sequence>)}
    {on("sfx") && SFX.map(([t, f, v, len], i) => (
      <Sequence key={i} from={sec(t)} durationInFrames={len ? sec(len) : undefined} name={f}>
        {/* effects step back under the voice; trimmed ones fade over their last 0.2s */}
        <Audio src={staticFile(`sfx/${f}.mp3`)} volume={(fr) => v * (1 - 0.6 * under(sec(t))) * (len ? Math.min(1, (sec(len) - fr) / 12) : 1)} />
      </Sequence>
    ))}
  </AbsoluteFill>
);

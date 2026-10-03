// Scene id → component for timeline.ts. This starter is deliberately small; the promo-video skill (step 6) replaces it with
// the real story (Tour / Counters / Typing … from ../recipes). Voice offsets must match timeline.ts voAt.
import React from "react";
import { AbsoluteFill } from "remotion";
import { Glide, IconReveal, LogoReveal, Outro, Spoken, words } from "../recipes";
import { TopTab } from "../kit";

type S = React.FC<{ dur: number }>;

export const SCENE_COMPONENTS: Record<string, S> = {
  intro: () => <IconReveal />,
  hook: ({ dur }) => <Spoken dur={dur} page="home" bottom size={84} at={0.4} words={words("01", ["really"])} cam={{ fx: 900, fy: 520, z: 1.7, rx: 7, ry: -5 }} />,
  logo: ({ dur }) => <LogoReveal dur={dur} />,
  tour: ({ dur }) => (
    <AbsoluteFill>
      <Glide dur={dur} page="home" from={{ fx: 640, fy: 300, z: 1.5, rx: 7, ry: 5 }} to={{ fx: 760, fy: 360, z: 1.55, rx: 6, ry: -3 }} />
      <TopTab text="Home" at={6} />
    </AbsoluteFill>
  ),
  // words 1..3 of line 04 = the tagline ("Your product, live."); the URL pill appears as she says it
  outro: () => <Outro at={0.7} words={words("04", ["live."], 1, 4)} urlAt={2.9} />,
  end: () => <IconReveal />,
};

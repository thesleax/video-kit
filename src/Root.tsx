import React from "react";
import { Composition } from "remotion";
import { Promo, TOTAL } from "./Promo";
import { FPS } from "./kit";

export const Root: React.FC = () => <Composition id="Promo" component={Promo} durationInFrames={TOTAL} fps={FPS} width={1920} height={1080} />;

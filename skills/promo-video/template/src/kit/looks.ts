// Looks: the film's visual language, chosen per product (scripts/direct.py suggests one from the product's own
// signals; the agent decides and records it in src/project/direction.ts). Every component reads DIRECTION, so the
// same scenes come out as a neon gaming trailer, a calm B2B film or a developer-tool cut.

export type Direction = {
  look: string;
  /** chrome of the video itself (background, shades) — follows the product's theme */
  theme: "dark" | "light";
  caption: {
    /** where spoken words sit: bottom-left over a gradient, centred, a left editorial column, or a lower-third bar */
    position: "bottom-left" | "center" | "left-column" | "lower-third";
    size: number; // px at 1080p for the main caption
    weights: [number, number]; // [regular word, *accent* word]
    upper?: boolean;
    tracking?: number; // em
    font?: "brand" | "display" | "mono";
  };
  /** section names: hanging top tab, "01 · Title" chapter mark, small corner tag, or nothing */
  label: "tab" | "chapter" | "corner" | "none";
  camera: { tilt: number; dof: number }; // multipliers on scene tilt (rx/ry/rz) and on focus-pull strength
  /** how one scene hands over to the next */
  transition: "blur" | "push" | "zoom" | "wipe" | "fade";
  intro: "icon" | "wordmark";
  backdrop: { tint: number; vignette: number }; // brand-coloured glow strength, edge darkening
  cursor: "mac" | "none";
  /** default SFX character the timeline should use (see references/SOUND.md) */
  sfx: "ui" | "soft" | "tech" | "playful" | "cinematic";
};

export const LOOKS: Record<string, Direction> = {
  // Gaming, communities, creator platforms on dark neon UIs. The reference film.
  night: {
    look: "night", theme: "dark",
    caption: { position: "bottom-left", size: 84, weights: [300, 800] },
    label: "tab", camera: { tilt: 1, dof: 1 }, transition: "blur", intro: "icon",
    backdrop: { tint: 0.12, vignette: 0.85 }, cursor: "mac", sfx: "ui",
  },
  // B2B SaaS, finance, ops, analytics for teams: composed, flat-ish camera, editorial left column, chapter numbers.
  studio: {
    look: "studio", theme: "dark",
    caption: { position: "left-column", size: 64, weights: [400, 700] },
    label: "chapter", camera: { tilt: 0.35, dof: 0.7 }, transition: "push", intro: "wordmark",
    backdrop: { tint: 0.05, vignette: 0.6 }, cursor: "mac", sfx: "soft",
  },
  // Media, publishing, portfolios, serif brands: slow, centred display type, wipes, almost no effects.
  editorial: {
    look: "editorial", theme: "dark",
    caption: { position: "center", size: 104, weights: [400, 700], font: "display" },
    label: "corner", camera: { tilt: 0.25, dof: 0.8 }, transition: "wipe", intro: "wordmark",
    backdrop: { tint: 0.04, vignette: 0.5 }, cursor: "mac", sfx: "soft",
  },
  // Consumer, social, youth, e-commerce: big centred kinetic words, punchy zoom cuts, playful sounds.
  kinetic: {
    look: "kinetic", theme: "dark",
    caption: { position: "center", size: 132, weights: [800, 900], upper: true, tracking: -0.03 },
    label: "none", camera: { tilt: 1.2, dof: 1 }, transition: "zoom", intro: "icon",
    backdrop: { tint: 0.22, vignette: 0.7 }, cursor: "mac", sfx: "playful",
  },
  // Developer tools, APIs, infra, CLIs: mono labels, lower-third captions, crisp cuts, tech sounds.
  terminal: {
    look: "terminal", theme: "dark",
    caption: { position: "lower-third", size: 56, weights: [400, 700], font: "mono" },
    label: "corner", camera: { tilt: 0.5, dof: 0.6 }, transition: "fade", intro: "wordmark",
    backdrop: { tint: 0.06, vignette: 0.75 }, cursor: "mac", sfx: "tech",
  },
};

/** Start from a look, override anything: direct({ look: "studio", caption: { position: "center" } }) */
export const direct = (o: Partial<Omit<Direction, "caption" | "camera" | "backdrop">> & { look: string; caption?: Partial<Direction["caption"]>; camera?: Partial<Direction["camera"]>; backdrop?: Partial<Direction["backdrop"]> }): Direction => {
  const base = LOOKS[o.look] ?? LOOKS.night;
  return { ...base, ...o, caption: { ...base.caption, ...o.caption }, camera: { ...base.camera, ...o.camera }, backdrop: { ...base.backdrop, ...o.backdrop } } as Direction;
};

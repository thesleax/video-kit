// Per-project brand. Fill from `npm run detect` (it reads the host project's CSS tokens, fonts and logo).
// Colors should be the site's own DARK theme tokens: overlays are drawn on top of its screenshots.
export const BRAND = {
  name: "ACME",
  url: "acme.com",
  tagline: ["Your", "product,", "*live.*"], // words of the closing line; *word* = bold
  colors: {
    primary: "#5f82ff", // accent / buttons
    primarySoft: "#9db4ff", // lighter accent for glows and gradients
    bg: "#0b0d11", // page background
    card: "#14171c", // card surface (Num overlays cover values with this)
    muted: "#1b1f26",
    border: "#242831",
    fg: "#eef0f3",
    dim: "#9aa1ad",
    green: "#2fbf62",
  },
  // Font file copied into public/fonts/ (woff2), same family the site uses.
  font: { family: "Brand", file: "fonts/brand.woff2", weights: "300 900" },
  // Logo mark (square icon) copied into public/brand/. Shown alone in the intro and end card.
  logo: { file: "brand/logo.svg", tilt: -12 },
};

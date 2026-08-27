import type { Config } from "tailwindcss";

// Design tokens — derived from the client's reference screenshots:
// near-black ground, bone/cream ink, one acid-chartreuse accent used sparingly,
// hairline dividers, generous negative space, condensed all-caps display type,
// a script wordmark for the logo, tracked-out monospace-ish labels for nav/meta.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0a0a09", // page ground
        "ink-raised": "#111110", // slightly lifted panels (drawers, cards)
        bone: "#f2ede2", // primary text on dark
        "bone-dim": "#8a877e", // secondary/muted text
        hairline: "rgba(242,237,226,0.10)",
        accent: "#e7ff3c", // acid chartreuse — reserved for one emphasis moment per view
      },
      fontFamily: {
        script: ["var(--font-script)"], // logo wordmark only
        display: ["var(--font-display)"], // big condensed headlines
        hero: ['Impact', '"Arial Black"', "sans-serif"], // hero only — chunky block, normal-width (Impact + Arial Black system fallback)
        body: ["var(--font-body)"], // paragraphs
        label: ["var(--font-label)"], // nav / eyebrows / footer meta
      },
      letterSpacing: {
        widest2: "0.22em",
      },
      maxWidth: {
        content: "1800px",
      },
    },
  },
  plugins: [],
};

export default config;

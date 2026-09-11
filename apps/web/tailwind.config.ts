import type { Config } from "tailwindcss";

// Design tokens for Collabify: a warm, editorial palette that avoids the
// generic "AI dashboard" cream+terracotta or near-black+neon-accent looks.
// Primary accent is a deep teal ("signal") standing for an active
// collaboration; clay is used sparingly for live/urgent states only.
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F5F6F2",
        ink: "#14151B",
        slate: "#6B6F76",
        border: "#DFE0D9",
        signal: { DEFAULT: "#1F7A5C", dark: "#155C45", light: "#E4F1EC" },
        clay: { DEFAULT: "#C9622A", light: "#F7E7DD" },
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        sans: ["var(--font-inter)", "sans-serif"],
      },
      maxWidth: { prose: "70ch" },
    },
  },
  plugins: [],
} satisfies Config;

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Themeable neo-brutalist base (driven by CSS vars → light/dark)
        paper: "rgb(var(--paper-rgb) / <alpha-value>)",
        "paper-2": "rgb(var(--paper2-rgb) / <alpha-value>)",
        ink: "rgb(var(--ink-rgb) / <alpha-value>)",
        card: "rgb(var(--card-rgb) / <alpha-value>)",
        // Always-dark ink for text sitting on bright accent blocks (note colours,
        // brand hovers) — these blocks stay bright in both themes.
        "ink-fixed": "#141210",
        "ink-soft": "#3a352e",
        // Brand accent (kept violet for continuity, punched up)
        brand: "#7C5CFF",
        "brand-ink": "#4B2FD6",
        // Solid note/folder block colors — vivid, readable with black ink on top
        note: {
          purple: "#B7A2FF",
          teal: "#5EEAD4",
          blue: "#7CA0FF",
          green: "#8FE388",
          orange: "#FF9F45",
          red: "#FF7A7A",
          yellow: "#FFD23F",
          brown: "#D9A874",
          indigo: "#9B9CFF",
        },
        // "Stamped card" system (see globals.css). Deliberately theme-independent
        // — it reads as printed paper, so it does not flip with .dark.
        stamp: {
          ink: "var(--sc-ink)",
          paper: "var(--sc-paper)",
          ground: "var(--sc-ground)",
          periwinkle: "var(--sc-periwinkle)",
          lime: "var(--sc-lime)",
          pink: "var(--sc-pink)",
          cyan: "var(--sc-cyan)",
          tangerine: "var(--sc-tangerine)",
          danger: "var(--sc-danger)",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
        // Stamped-card families
        "stamp-display": ["var(--font-stamp-display)", "system-ui", "sans-serif"],
        "stamp-body": ["var(--font-stamp-body)", "system-ui", "sans-serif"],
        "stamp-mono": ["var(--font-stamp-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        brutal: "5px 5px 0 0 rgb(var(--ink-rgb))",
        "brutal-sm": "3px 3px 0 0 rgb(var(--ink-rgb))",
        "brutal-lg": "8px 8px 0 0 rgb(var(--ink-rgb))",
        "brutal-xl": "12px 12px 0 0 rgb(var(--ink-rgb))",
        "brutal-brand": "5px 5px 0 0 #7C5CFF",
        // Stamped-card lift scale — hard, zero blur, zero spread
        "lift-0": "var(--sc-lift-0)",
        "lift-1": "var(--sc-lift-1)",
        "lift-2": "var(--sc-lift-2)",
        "lift-panel": "var(--sc-lift-panel)",
      },
      transitionTimingFunction: {
        stamp: "var(--sc-ease)",
      },
      borderWidth: {
        3: "3px",
      },
      keyframes: {
        "slide-in": {
          "0%": { transform: "translateX(120%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "pop-in": {
          "0%": { transform: "scale(0.9)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
      },
      animation: {
        "slide-in": "slide-in 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
        "pop-in": "pop-in 0.18s ease-out",
        marquee: "marquee 30s linear infinite",
        blink: "blink 1s step-end infinite",
      },
    },
  },
  plugins: [],
};

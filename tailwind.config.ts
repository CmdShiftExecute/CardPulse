import type { Config } from "tailwindcss";

/** Helper: creates a Tailwind color value from a CSS variable name.
 *  Stored as RGB channels in CSS (e.g. `--color-base: 11 14 19`),
 *  referenced here with `<alpha-value>` placeholder for opacity modifier support.
 *  Usage: `bg-base`, `bg-base/50`, `text-sage-400/80` all work. */
const cv = (name: string) => `rgb(var(--color-${name}) / <alpha-value>)`;

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    fontSize: {
      xs: ["0.6875rem", { lineHeight: "1rem" }],
      sm: ["0.8125rem", { lineHeight: "1.25rem" }],
      base: ["0.9375rem", { lineHeight: "1.5rem" }],
      lg: ["1.0625rem", { lineHeight: "1.625rem" }],
      xl: ["1.3125rem", { lineHeight: "1.75rem" }],
      "2xl": ["1.6875rem", { lineHeight: "2rem" }],
      "3xl": ["2.125rem", { lineHeight: "2.5rem" }],
    },
    extend: {
      colors: {
        // Backgrounds (layered depth)
        base: cv("base"),
        surface: {
          1: cv("surface-1"),
          2: cv("surface-2"),
          3: cv("surface-3"),
        },
        border: {
          DEFAULT: cv("border"),
          hover: cv("border-hover"),
        },

        // Primary Accent — Sage Green
        sage: {
          200: cv("sage-200"),
          300: cv("sage-300"),
          400: cv("sage-400"),
          500: cv("sage-500"),
          glow: "rgb(var(--color-sage-400) / 0.08)",
        },

        // Secondary Accent — Seafoam
        seafoam: {
          200: cv("seafoam-200"),
          300: cv("seafoam-300"),
          400: cv("seafoam-400"),
        },

        // Tertiary Accent — Warm Sand
        sand: {
          200: cv("sand-200"),
          300: cv("sand-300"),
          400: cv("sand-400"),
        },

        // Chart Colors
        chart: {
          1: cv("chart-1"),
          2: cv("chart-2"),
          3: cv("chart-3"),
          4: cv("chart-4"),
          5: cv("chart-5"),
          6: cv("chart-6"),
          7: cv("chart-7"),
          8: cv("chart-8"),
        },

        // Status Colors
        success: cv("success"),
        warning: cv("warning"),
        danger: cv("danger"),
        info: cv("info"),

        // Text
        "text-primary": cv("text-primary"),
        "text-secondary": cv("text-secondary"),
        "text-muted": cv("text-muted"),
        "text-on-accent": cv("text-on-accent"),
      },
      borderRadius: {
        card: "12px",
        button: "8px",
        input: "8px",
      },
      spacing: {
        sidebar: "260px",
        "sidebar-collapsed": "64px",
      },
      maxWidth: {
        page: "1440px",
        content: "1200px",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "'Fira Code'", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;

import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";
import fs from "node:fs";

const tokens = JSON.parse(
  fs.readFileSync(new URL("./design-tokens.json", import.meta.url), "utf-8")
);

const spacing = {
  ...Object.fromEntries(
    Object.keys(tokens.spacing).map((key) => [key, `var(--space-${key})`])
  ),
  "safe-top": "var(--safe-area-top)",
  "safe-right": "var(--safe-area-right)",
  "safe-bottom": "var(--safe-area-bottom)",
  "safe-left": "var(--safe-area-left)",
  "edge-top": "var(--edge-top)",
  "edge-right": "var(--edge-right)",
  "edge-bottom": "var(--edge-bottom)",
  "edge-left": "var(--edge-left)",
};

const borderRadius = Object.fromEntries(
  Object.keys(tokens.radii).map((key) => [key, `var(--radius-${key})`])
);

const transitionTimingFunction = Object.fromEntries(
  Object.keys(tokens.easing).map((key) => [key, `var(--ease-${key})`])
);

const transitionDuration = Object.fromEntries(
  Object.keys(tokens.duration).map((key) => [key, `var(--duration-${key})`])
);

const flatColors = tokens.colors.flat.reduce(
  (acc: Record<string, string>, key: string) => {
    acc[key] = `hsl(var(--${key}))`;
    return acc;
  },
  {}
);

const paletteColors = tokens.colors.palette.reduce(
  (acc: Record<string, { DEFAULT: string; foreground: string }>, key: string) => {
    acc[key] = {
      DEFAULT: `hsl(var(--${key}))`,
      foreground: `hsl(var(--${key}-foreground))`,
    };
    return acc;
  },
  {}
);

const sidebarColors = tokens.colors.sidebar.reduce(
  (acc: Record<string, string>, key: string) => {
    acc[key] = `hsl(var(--sidebar-${key}))`;
    return acc;
  },
  {}
);

const colors = { ...flatColors, ...paletteColors, sidebar: sidebarColors };

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "var(--space-2xl)",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      spacing,
      colors,
      borderRadius,
      transitionTimingFunction,
      transitionDuration,
      keyframes: {
        "accordion-down": {
          from: { height: "0", opacity: "0" },
          to: {
            height: "var(--radix-accordion-content-height)",
            opacity: "1",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
            opacity: "1",
          },
          to: { height: "0", opacity: "0" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-out": {
          "0%": { opacity: "1", transform: "translateY(0)" },
          "100%": { opacity: "0", transform: "translateY(10px)" },
        },
        "scale-in": {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "scale-out": {
          from: { transform: "scale(1)", opacity: "1" },
          to: { transform: "scale(0.95)", opacity: "0" },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "slide-out-right": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "accordion-down":
          "accordion-down var(--duration-fast) var(--ease-standard)",
        "accordion-up":
          "accordion-up var(--duration-fast) var(--ease-standard)",
        "fade-in": "fade-in var(--duration-slow) var(--ease-standard)",
        "fade-out": "fade-out var(--duration-slow) var(--ease-standard)",
        "scale-in": "scale-in var(--duration-fast) var(--ease-standard)",
        "scale-out": "scale-out var(--duration-fast) var(--ease-standard)",
        "slide-in-right":
          "slide-in-right var(--duration-slow) var(--ease-standard)",
        "slide-out-right":
          "slide-out-right var(--duration-slow) var(--ease-standard)",
        // Combined
        enter:
          "fade-in var(--duration-slow) var(--ease-standard), scale-in var(--duration-fast) var(--ease-standard)",
        exit:
          "fade-out var(--duration-slow) var(--ease-standard), scale-out var(--duration-fast) var(--ease-standard)",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;

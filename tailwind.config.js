import { Config } from "tailwindcss";

const config = {
  // Dark mode is handled via CSS variables by default, but keeping "class" enables manual toggling if needed later
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // ─── CORE BRAND COLOR PALETTE ───
      colors: {
        navy: {
          50: "#C2C4D6",
          100: "#9A9EBE",
          200: "#6A6F9C",
          300: "#454A77",
          400: "#262A52",
          500: "#181A38",
          600: "#13152B", // Surface
          700: "#0F1124", // Inputs / Cards
          800: "#0A0B1E", // Main Background
          900: "#060713", // Deep Sections
          950: "#03040A", // Footer / Utter Depth
        },
        purple: {
          50: "#F1EDFF",
          100: "#E1D9FF",
          200: "#C7B8FE",
          300: "#AE9AFC",
          400: "#9B8AFB", // Secondary Accent
          500: "#7C5CFC", // Primary Accent / CTA
          600: "#6E4FF5", // Hover State
          700: "#5B3CE0",
          800: "#4830B3",
          900: "#352486",
          950: "#221659",
        },
        lavender: {
          300: "#C7C9DC",
          400: "#A0A3BD", // Secondary Text
          500: "#7A7E9C", // Muted Icons / Placeholders
        },
        // Semantic overrides pointing to your CSS variables
        background: "var(--color-background)",
        foreground: "var(--color-text-primary)",
        primary: "var(--color-primary)",
        surface: "var(--color-surface)",
        border: "var(--color-border)",
      },

      // ─── TYPOGRAPHY ───
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: [
          "var(--font-jetbrains-mono)",
          "ui-monospace",
          "SFMono-Regular",
          "monospace",
        ],
      },

      // ─── CUSTOM SHADOWS (DEPTH & GLOWS) ───
      boxShadow: {
        // Deep Navy Shadows for structural depth without muddiness
        "depth-sm": "0 4px 12px rgba(3, 4, 10, 0.4)",
        "depth-base": "0 4px 20px rgba(3, 4, 10, 0.5)",
        "depth-md": "0 12px 32px rgba(3, 4, 10, 0.6)",
        "depth-lg": "0 24px 64px rgba(3, 4, 10, 0.7)",

        // Vivid Purple Glows for Hover States & CTAs
        "glow-sm": "0 4px 12px rgba(124, 92, 252, 0.15)",
        "glow-base": "0 8px 24px rgba(124, 92, 252, 0.25)",
        "glow-md": "0 16px 40px rgba(124, 92, 252, 0.40)",
        "glow-lg": "0 24px 64px rgba(124, 92, 252, 0.50)",
      },

      // ─── BACKGROUND IMAGES & GRADIENTS ───
      backgroundImage: {
        "radial-gradient": "radial-gradient(var(--tw-gradient-stops))",
        "premium-glow":
          "linear-gradient(180deg, rgba(124, 92, 252, 0.05) 0%, rgba(3, 4, 10, 0) 100%)",
      },

      // ─── ANIMATIONS (Used in your CTA and Loaders) ───
      animation: {
        "spin-slow": "spin 3s linear infinite",
        "pulse-fast": "pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [
    // Standard plugins for high-end UI components.
    // Ensure you run: npm install tailwindcss-animate
    require("tailwindcss-animate"),
  ],
};

export default config;

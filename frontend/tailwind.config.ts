import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
        "ax-sans": ["DM Sans", "system-ui", "sans-serif"],
        "ax-mono": ["IBM Plex Mono", "JetBrains Mono", "monospace"],
        "ax-display": ["Playfair Display", "Georgia", "serif"],
      },
      colors: {
        /* ── Core palette ── */
        "ax-bg": {
          deep: "#06080D",
          base: "#0A0F17",
          elevated: "#0E1520",
          raised: "#131B28",
        },
        "ax-surface": {
          DEFAULT: "#0A0F17",
          light: "#0E1520",
          dark: "#06080D",
          platinum: "rgba(225, 231, 239, 0.10)",
        },
        "ax-wine": {
          DEFAULT: "#8B3152",
          light: "#B14A6D",
          dark: "#5C1F36",
          muted: "rgba(139, 49, 82, 0.12)",
        },
        "ax-gold": {
          DEFAULT: "#B59A62",
          light: "#c9b07a",
          dim: "rgba(181, 154, 98, 0.15)",
          glow: "rgba(181, 154, 98, 0.08)",
        },
        "ax-steel": {
          DEFAULT: "#567FA5",
          light: "#6d96bb",
          muted: "rgba(86, 127, 165, 0.12)",
        },
        "ax-text": {
          primary: "#E7ECF3",
          secondary: "#919CAA",
          muted: "#5A6577",
          subtle: "#3D4756",
        },
        "ax-accent": {
          primary: "#8B3152",
          secondary: "#919CAA",
          success: "#16a34a",
          warning: "#B59A62",
          danger: "#991b1b",
          info: "#567FA5",
        },

        /* ── Glass surfaces ── */
        "ax-glass": {
          DEFAULT: "rgba(17, 23, 34, 0.72)",
          light: "rgba(17, 23, 34, 0.50)",
          solid: "rgba(17, 23, 34, 0.88)",
          border: "rgba(255, 255, 255, 0.10)",
          "border-strong": "rgba(255, 255, 255, 0.18)",
          highlight: "rgba(255, 255, 255, 0.12)",
        },

        /* ── Aliases for backward compat ── */
        platinum: {
          DEFAULT: "#E7ECF3",
          light: "#f0f3f7",
          dim: "#919CAA",
        },
        glass: {
          dark: "rgba(17, 23, 34, 0.72)",
          medium: "rgba(17, 23, 34, 0.50)",
          light: "rgba(255, 255, 255, 0.06)",
          border: "rgba(255, 255, 255, 0.10)",
          highlight: "rgba(255, 255, 255, 0.12)",
        },
        obsidian: {
          deep: "#06080D",
          card: "rgba(10, 15, 23, 0.72)",
          surface: "rgba(17, 23, 34, 0.72)",
        },
        gold: {
          premium: "#B59A62",
          light: "#c9b07a",
          dim: "rgba(181, 154, 98, 0.15)",
          glow: "rgba(181, 154, 98, 0.08)",
        },
      },

      /* ── Blur ── */
      backdropBlur: {
        xs: "2px",
        glass: "18px",
        "glass-heavy": "24px",
      },

      /* ── Animations ── */
      animation: {
        "ax-fade-in": "axFadeIn 0.25s ease-out",
        "ax-slide-up": "axSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
        "ax-scale-in": "axScaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        "ax-shimmer": "axShimmer 2.5s linear infinite",
        "ax-glow-pulse": "axGlowPulse 3s ease-in-out infinite",
        "ax-pulse-wine": "axPulseWine 2s ease-in-out infinite",
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-in-right": "slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-in-left": "slideInLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
      },
      keyframes: {
        axFadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        axSlideUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        axScaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        axShimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        axGlowPulse: {
          "0%, 100%": { opacity: "0.3" },
          "50%": { opacity: "0.6" },
        },
        axPulseWine: {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInRight: {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        slideInLeft: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
      },

      /* ── Shadows ── */
      boxShadow: {
        "ax-glass":
          "0 8px 32px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.06), inset 0 -1px 0 rgba(0, 0, 0, 0.2)",
        "ax-glass-inset":
          "inset 0 1px 0 rgba(255, 255, 255, 0.06), inset 0 -1px 0 rgba(0, 0, 0, 0.3)",
        "ax-card":
          "0 4px 20px rgba(0, 0, 0, 0.4), 0 1px 3px rgba(0, 0, 0, 0.3)",
        "ax-elevated": "0 8px 32px rgba(0, 0, 0, 0.5)",
        "ax-modal": "0 24px 80px rgba(0, 0, 0, 0.7)",
        "ax-inset": "inset 0 2px 6px rgba(0, 0, 0, 0.5)",
        "ax-inset-deep":
          "inset 0 3px 8px rgba(0, 0, 0, 0.6), inset 0 1px 2px rgba(0, 0, 0, 0.4)",
        "ax-glow-wine": "0 0 20px rgba(139, 49, 82, 0.15)",
        "ax-glow-gold": "0 0 16px rgba(181, 154, 98, 0.10)",
        "ax-sidebar":
          "4px 0 24px rgba(0, 0, 0, 0.4), inset -1px 0 0 rgba(255, 255, 255, 0.06)",
        "ax-input-float":
          "0 -2px 24px rgba(0, 0, 0, 0.35), 0 4px 16px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
        "neon-blue":
          "0 0 20px rgba(86, 127, 165, 0.2), 0 0 40px rgba(86, 127, 165, 0.08)",
        "gold-glow":
          "0 0 20px rgba(181, 154, 98, 0.15), 0 0 40px rgba(181, 154, 98, 0.06)",
        "ax-ring-wine": "0 0 0 3px rgba(139, 49, 82, 0.25)",
        "ax-ring-steel": "0 0 0 3px rgba(86, 127, 165, 0.25)",
        "ax-ring-gold": "0 0 0 3px rgba(181, 154, 98, 0.20)",
      },

      /* ── Border radius ── */
      borderRadius: {
        "ax-sm": "6px",
        "ax-md": "10px",
        "ax-lg": "14px",
        "ax-xl": "18px",
        "ax-2xl": "22px",
        "ax-full": "9999px",
      },
    },
  },
  plugins: [],
} satisfies Config;

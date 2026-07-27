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
        brand: {
          50: "#edfcff",
          100: "#d6f7ff",
          200: "#b5f0ff",
          300: "#83e8ff",
          400: "#48d5ff",
          500: "#00f0ff",
          600: "#00c8e0",
          700: "#009fb5",
          800: "#008294",
          900: "#006b7a",
          950: "#004050",
        },
        neon: {
          blue: "#00f0ff",
          cyan: "#00e5cc",
          orange: "#ff5e00",
          amber: "#ffaa00",
          red: "#ff3355",
          green: "#00ff88",
        },
        gold: {
          premium: "#d4af37",
          light: "#f3e5ab",
          dim: "rgba(212, 175, 55, 0.15)",
          glow: "rgba(212, 175, 55, 0.08)",
        },
        obsidian: {
          deep: "#07080a",
          card: "rgba(15, 17, 21, 0.7)",
          surface: "rgba(12, 14, 18, 0.85)",
        },
        platinum: {
          DEFAULT: "#8e9297",
          light: "#b0b4b8",
        },
        glass: {
          dark: "rgba(13, 15, 18, 0.6)",
          medium: "rgba(20, 24, 32, 0.45)",
          light: "rgba(255, 255, 255, 0.06)",
          border: "rgba(255, 255, 255, 0.12)",
          highlight: "rgba(255, 255, 255, 0.15)",
        },
        "ax-bg": {
          deep: "#080a10",
          base: "#0f1218",
          elevated: "#171c24",
          raised: "#1c222c",
        },
        "ax-surface": {
          DEFAULT: "#0f1218",
          light: "#171c24",
          dark: "#080a10",
        },
        "ax-wine": {
          DEFAULT: "#5c1a2a",
          light: "#7a2238",
          dark: "#3d1120",
        },
        "ax-gold": {
          DEFAULT: "#b8860b",
          light: "#d4a843",
          dim: "rgba(184, 134, 11, 0.15)",
          glow: "rgba(184, 134, 11, 0.08)",
        },
        "ax-accent": {
          primary: "#6f2640",
          secondary: "#8e9297",
          success: "#16a34a",
          warning: "#eab308",
          danger: "#991b1b",
          info: "#3b82f6",
        },
        "ax-text": {
          primary: "#e8eaed",
          secondary: "#9ca3af",
          muted: "#6b7280",
          subtle: "#4b5563",
        },
        "ax-glass": {
          DEFAULT: "rgba(15, 18, 24, 0.72)",
          light: "rgba(23, 28, 36, 0.65)",
          solid: "rgba(15, 18, 24, 0.85)",
          border: "rgba(255, 255, 255, 0.08)",
          "border-strong": "rgba(255, 255, 255, 0.12)",
        },
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-right": "slideRight 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
        "pulse-dot": "pulseDot 1.4s infinite ease-in-out both",
        "liquid-shift": "liquidShift 12s ease-in-out infinite",
        "glow-pulse": "glowPulse 3s ease-in-out infinite",
        "tilt-in": "tiltIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
        "scale-glass": "scaleGlass 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        "shimmer": "shimmer 2s linear infinite",
        "liquid-flow": "liquidFlow 20s ease-in-out infinite",
        "liquid-orb-1": "liquidOrb1 25s ease-in-out infinite",
        "liquid-orb-2": "liquidOrb2 30s ease-in-out infinite",
        "liquid-orb-3": "liquidOrb3 22s ease-in-out infinite",
        "gold-shimmer": "goldShimmer 3s ease-in-out infinite",
        "ax-fade-in": "axFadeIn 0.25s ease-out",
        "ax-slide-up": "axSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
        "ax-scale-in": "axScaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        "ax-shimmer": "axShimmer 2.5s linear infinite",
        "ax-glow-pulse": "axGlowPulse 3s ease-in-out infinite",
        "ax-ambient": "axAmbient 12s ease-in-out infinite",
        "ax-pulse-wine": "axPulseWine 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideRight: {
          "0%": { opacity: "0", transform: "translateX(-16px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        pulseDot: {
          "0%, 80%, 100%": { transform: "scale(0)" },
          "40%": { transform: "scale(1)" },
        },
        liquidShift: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        glowPulse: {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "0.8" },
        },
        tiltIn: {
          "0%": { opacity: "0", transform: "perspective(800px) rotateX(8deg) scale(0.95)" },
          "100%": { opacity: "1", transform: "perspective(800px) rotateX(0deg) scale(1)" },
        },
        scaleGlass: {
          "0%": { opacity: "0", transform: "scale(0.92)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        liquidFlow: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "25%": { backgroundPosition: "50% 0%" },
          "50%": { backgroundPosition: "100% 50%" },
          "75%": { backgroundPosition: "50% 100%" },
        },
        liquidOrb1: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(80px, -60px) scale(1.1)" },
          "66%": { transform: "translate(-40px, 40px) scale(0.95)" },
        },
        liquidOrb2: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(-70px, 50px) scale(1.05)" },
          "66%": { transform: "translate(50px, -30px) scale(0.9)" },
        },
        liquidOrb3: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(40px, 70px) scale(0.95)" },
          "66%": { transform: "translate(-60px, -50px) scale(1.08)" },
        },
        goldShimmer: {
          "0%, 100%": { opacity: "0.3" },
          "50%": { opacity: "0.7" },
        },
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
        axAmbient: {
          "0%, 100%": { opacity: "0.02" },
          "50%": { opacity: "0.04" },
        },
        axPulseWine: {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "1" },
        },
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
        "glass-inset":
          "inset 0 1px 0 0 rgba(255,255,255,0.15), inset 0 -1px 0 0 rgba(0,0,0,0.4)",
        "skeuo-soft": "2px 2px 5px rgba(0,0,0,0.4), inset 1px 1px 2px rgba(255,255,255,0.1)",
        "skeuo-pressed": "inset 2px 2px 5px rgba(0,0,0,0.5)",
        "neon-blue": "0 0 20px rgba(0, 240, 255, 0.3), 0 0 40px rgba(0, 240, 255, 0.1)",
        "neon-orange": "0 0 20px rgba(255, 94, 0, 0.3), 0 0 40px rgba(255, 94, 0, 0.1)",
        "gold-glow": "0 0 20px rgba(212, 175, 55, 0.2), 0 0 40px rgba(212, 175, 55, 0.08)",
        "gold-glow-lg": "0 0 30px rgba(212, 175, 55, 0.3), 0 0 60px rgba(212, 175, 55, 0.1)",
        "premium-panel":
          "0 20px 60px -15px rgba(0, 0, 0, 0.6), inset 0 1px 0 0 rgba(212, 175, 55, 0.1), inset 0 -1px 0 0 rgba(0, 0, 0, 0.3)",
        "premium-card":
          "0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 0 0 1px rgba(212, 175, 55, 0.08)",
        "skeuo-gold":
          "2px 3px 6px rgba(0, 0, 0, 0.5), inset 1px 1px 2px rgba(243, 229, 171, 0.15), inset -1px -1px 2px rgba(0, 0, 0, 0.3)",
        "skeuo-gold-active":
          "inset 2px 3px 6px rgba(0, 0, 0, 0.6), inset -1px -1px 2px rgba(243, 229, 171, 0.05)",
        "input-recessed":
          "inset 0 3px 8px rgba(0, 0, 0, 0.7), inset 0 1px 2px rgba(0, 0, 0, 0.5), 0 1px 0 rgba(255, 255, 255, 0.04)",
        "ax-card": "0 4px 20px rgba(0, 0, 0, 0.4), 0 1px 3px rgba(0, 0, 0, 0.3)",
        "ax-elevated": "0 8px 32px rgba(0, 0, 0, 0.5)",
        "ax-modal": "0 24px 80px rgba(0, 0, 0, 0.7)",
        "ax-inset": "inset 0 2px 6px rgba(0, 0, 0, 0.5)",
        "ax-inset-deep": "inset 0 3px 8px rgba(0, 0, 0, 0.7), inset 0 1px 2px rgba(0, 0, 0, 0.5)",
        "ax-glow-wine": "0 0 20px rgba(111, 38, 64, 0.15)",
        "ax-glow-gold": "0 0 16px rgba(184, 134, 11, 0.12)",
      },
      backgroundImage: {
        "liquid-gradient":
          "linear-gradient(135deg, rgba(0,240,255,0.08), rgba(255,94,0,0.05), rgba(0,240,255,0.08))",
        "shimmer-gradient":
          "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 50%, transparent 100%)",
        "gold-gradient":
          "linear-gradient(135deg, rgba(212,175,55,0.15), rgba(243,229,171,0.05), rgba(212,175,55,0.1))",
        "gold-border-gradient":
          "linear-gradient(135deg, rgba(212,175,55,0.3), rgba(243,229,171,0.1), rgba(212,175,55,0.2))",
        "ax-ambient":
          "radial-gradient(ellipse at center, rgba(111, 38, 64, 0.03) 0%, transparent 70%)",
        "ax-shimmer":
          "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)",
      },
    },
  },
  plugins: [],
} satisfies Config;

import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {

      /* ─── FONT FAMILIES ────────────────────────────────── */
      fontFamily: {
        'sans':           ['Plus Jakarta Sans', 'sans-serif'],
        'plus-jakarta':   ['Plus Jakarta Sans', 'sans-serif'],
        'display':        ['Inter', 'sans-serif'],
        'geist':          ['Inter', 'sans-serif'],
        'poppins':        ['Poppins', 'sans-serif'],
        'mono':           ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },

      /* ─── COLORS ───────────────────────────────────────── */
      colors: {
        /* TravelHomes design tokens */
        th: {
          brand:           "var(--th-brand)",
          "brand-hover":   "var(--th-brand-hover)",
          "brand-fg":      "var(--th-brand-fg)",

          "surface-0":     "var(--th-surface-0)",
          "surface-1":     "var(--th-surface-1)",
          "surface-2":     "var(--th-surface-2)",
          "surface-3":     "var(--th-surface-3)",
          "surface-raised":"var(--th-surface-raised)",

          "text-primary":  "var(--th-text-primary)",
          "text-secondary":"var(--th-text-secondary)",
          "text-tertiary": "var(--th-text-tertiary)",
          "text-muted":    "var(--th-text-muted)",
          "text-placeholder":"var(--th-text-placeholder)",
          "text-inverse":  "var(--th-text-inverse)",
          "text-link":     "var(--th-text-link)",

          border:          "var(--th-border)",
          "border-hover":  "var(--th-border-hover)",
          "border-focus":  "var(--th-border-focus)",
          "border-error":  "var(--th-border-error)",

          success:         "var(--th-success)",
          "success-bg":    "var(--th-success-bg)",
          "success-text":  "var(--th-success-text)",
          warning:         "var(--th-warning)",
          "warning-bg":    "var(--th-warning-bg)",
          "warning-text":  "var(--th-warning-text)",
          error:           "var(--th-error)",
          "error-bg":      "var(--th-error-bg)",
          "error-text":    "var(--th-error-text)",
          info:            "var(--th-info)",
          "info-bg":       "var(--th-info-bg)",
          "info-text":     "var(--th-info-text)",
          "purple-bg":     "var(--th-purple-bg)",
          "purple-text":   "var(--th-purple-text)",

          accent:          "var(--th-accent)",
          "accent-fg":     "var(--th-accent-fg)",
          "accent-subtle": "var(--th-accent-subtle)",

          "stat-impression":      "var(--th-stat-impression)",
          "stat-impression-icon": "var(--th-stat-impression-icon)",
          "stat-bookings":        "var(--th-stat-bookings)",
          "stat-bookings-icon":   "var(--th-stat-bookings-icon)",
          "stat-properties":      "var(--th-stat-properties)",
          "stat-properties-icon": "var(--th-stat-properties-icon)",
          "stat-earnings":        "var(--th-stat-earnings)",
          "stat-earnings-icon":   "var(--th-stat-earnings-icon)",
          "stat-clicks":          "var(--th-stat-clicks)",
          "stat-clicks-icon":     "var(--th-stat-clicks-icon)",

          overlay:         "var(--th-overlay)",
          "booking-link":  "var(--th-booking-link)",
        },

        /* shadcn compat (unchanged) */
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },

        /* Legacy dashboard (keep working) */
        dashboard: {
          bg: "hsl(var(--dashboard-bg))",
          primary: "hsl(var(--dashboard-primary))",
          heading: "hsl(var(--dashboard-heading))",
          body: "hsl(var(--dashboard-body))",
          title: "hsl(var(--dashboard-title))",
          stroke: "hsl(var(--dashboard-stroke))",
          neutral06: "hsl(var(--dashboard-neutral-06))",
          neutral07: "hsl(var(--dashboard-neutral-07))",
          text: "hsl(var(--dashboard-text))",
        },
        stats: {
          impression: {
            bg: "hsl(var(--stats-impression-bg))",
            icon: "hsl(var(--stats-impression-icon-bg))",
          },
          bookings: {
            bg: "hsl(var(--stats-bookings-bg))",
            icon: "hsl(var(--stats-bookings-icon-bg))",
          },
          properties: {
            bg: "hsl(var(--stats-properties-bg))",
            icon: "hsl(var(--stats-properties-icon-bg))",
          },
          earnings: {
            bg: "hsl(var(--stats-earnings-bg))",
            icon: "hsl(var(--stats-earnings-icon-bg))",
          },
          clicks: {
            bg: "hsl(var(--stats-clicks-bg))",
            icon: "hsl(var(--stats-clicks-icon-bg))",
          },
        },
        status: {
          orange: {
            bg: "hsl(var(--status-orange-bg))",
            text: "hsl(var(--status-orange-text))",
          },
          purple: {
            bg: "hsl(var(--status-purple-bg))",
            text: "hsl(var(--status-purple-text))",
          },
          green: {
            bg: "hsl(var(--status-green-bg))",
            text: "hsl(var(--status-green-text))",
          },
        },
        'status-orange-bg': "hsl(var(--status-orange-bg))",
        'status-orange-text': "hsl(var(--status-orange-text))",
        'status-purple-bg': "hsl(var(--status-purple-bg))",
        'status-purple-text': "hsl(var(--status-purple-text))",
        'status-green-bg': "hsl(var(--status-green-bg))",
        'status-green-text': "hsl(var(--status-green-text))",
        booking: {
          link: "hsl(var(--booking-link))",
        },
      },

      /* ─── SPACING (extends default) ────────────────────── */
      spacing: {
        "th-0.5": "var(--th-space-0\\.5)",
        "th-1":   "var(--th-space-1)",
        "th-1.5": "var(--th-space-1\\.5)",
        "th-2":   "var(--th-space-2)",
        "th-3":   "var(--th-space-3)",
        "th-4":   "var(--th-space-4)",
        "th-5":   "var(--th-space-5)",
        "th-6":   "var(--th-space-6)",
        "th-8":   "var(--th-space-8)",
        "th-10":  "var(--th-space-10)",
        "th-12":  "var(--th-space-12)",
        "th-16":  "var(--th-space-16)",
        "th-20":  "var(--th-space-20)",
        "th-24":  "var(--th-space-24)",
      },

      /* ─── BORDER RADIUS ────────────────────────────────── */
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        "th-sm":   "var(--th-radius-sm)",
        "th-md":   "var(--th-radius-md)",
        "th-lg":   "var(--th-radius-lg)",
        "th-xl":   "var(--th-radius-xl)",
        "th-2xl":  "var(--th-radius-2xl)",
        "th-3xl":  "var(--th-radius-3xl)",
        "th-full": "var(--th-radius-full)",
      },

      /* ─── BOX SHADOW ───────────────────────────────────── */
      boxShadow: {
        "th-xs":    "var(--th-shadow-xs)",
        "th-sm":    "var(--th-shadow-sm)",
        "th-md":    "var(--th-shadow-md)",
        "th-lg":    "var(--th-shadow-lg)",
        "th-xl":    "var(--th-shadow-xl)",
        "th-2xl":   "var(--th-shadow-2xl)",
        "th-inner": "var(--th-shadow-inner)",
        "th-ring":  "var(--th-shadow-ring)",
        "th-ring-error": "var(--th-shadow-ring-error)",
      },

      /* ─── TRANSITIONS ──────────────────────────────────── */
      transitionTimingFunction: {
        "th-default": "var(--th-ease-default)",
        "th-in":      "var(--th-ease-in)",
        "th-out":     "var(--th-ease-out)",
        "th-spring":  "var(--th-ease-spring)",
        "th-bounce":  "var(--th-ease-bounce)",
      },
      transitionDuration: {
        "th-fast":    "var(--th-duration-fast)",
        "th-normal":  "var(--th-duration-normal)",
        "th-slow":    "var(--th-duration-slow)",
        "th-slower":  "var(--th-duration-slower)",
      },

      /* ─── Z-INDEX ──────────────────────────────────────── */
      zIndex: {
        "dropdown": "50",
        "sticky":   "100",
        "overlay":  "200",
        "modal":    "300",
        "toast":    "400",
        "tooltip":  "500",
      },

      /* ─── FONT SIZE ────────────────────────────────────── */
      fontSize: {
        "th-xs":   ["var(--th-text-xs)",   { lineHeight: "var(--th-leading-normal)" }],
        "th-sm":   ["var(--th-text-sm)",   { lineHeight: "var(--th-leading-normal)" }],
        "th-base": ["var(--th-text-base)", { lineHeight: "var(--th-leading-relaxed)" }],
        "th-lg":   ["var(--th-text-lg)",   { lineHeight: "var(--th-leading-snug)" }],
        "th-xl":   ["var(--th-text-xl)",   { lineHeight: "var(--th-leading-snug)" }],
        "th-2xl":  ["var(--th-text-2xl)",  { lineHeight: "var(--th-leading-tight)" }],
        "th-3xl":  ["var(--th-text-3xl)",  { lineHeight: "var(--th-leading-tight)" }],
        "th-4xl":  ["var(--th-text-4xl)",  { lineHeight: "var(--th-leading-tight)" }],
      },

      /* ─── KEYFRAMES & ANIMATION ────────────────────────── */
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "th-fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "th-fade-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "th-fade-down": {
          from: { opacity: "0", transform: "translateY(-20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "th-slide-left": {
          from: { opacity: "0", transform: "translateX(-24px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "th-slide-right": {
          from: { opacity: "0", transform: "translateX(24px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "th-scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "th-bounce-in": {
          "0%": { opacity: "0", transform: "scale(0.3)" },
          "50%": { opacity: "1", transform: "scale(1.05)" },
          "70%": { transform: "scale(0.95)" },
          "100%": { transform: "scale(1)" },
        },
        "th-pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
        "th-shimmer": {
          from: { backgroundPosition: "-400px 0" },
          to: { backgroundPosition: "400px 0" },
        },
      },
      animation: {
        "accordion-down":   "accordion-down 0.2s ease-out",
        "accordion-up":     "accordion-up 0.2s ease-out",
        "th-fade-in":       "th-fade-in 0.2s var(--th-ease-default) both",
        "th-fade-up":       "th-fade-up 0.35s var(--th-ease-spring) both",
        "th-fade-down":     "th-fade-down 0.35s var(--th-ease-spring) both",
        "th-slide-left":    "th-slide-left 0.35s var(--th-ease-spring) both",
        "th-slide-right":   "th-slide-right 0.35s var(--th-ease-spring) both",
        "th-scale-in":      "th-scale-in 0.2s var(--th-ease-spring) both",
        "th-bounce-in":     "th-bounce-in 0.5s var(--th-ease-bounce) both",
        "th-pulse-soft":    "th-pulse-soft 2s var(--th-ease-default) infinite",
        "th-shimmer":       "th-shimmer 1.6s ease-in-out infinite",
      },

      /* ─── GRID (existing) ──────────────────────────────── */
      gridTemplateColumns: {
        '16': 'repeat(16, minmax(0, 1fr))',
        'calendar': '231px repeat(15, 60px)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

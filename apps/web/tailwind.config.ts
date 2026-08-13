import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

export default {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}", "./index.html"],
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
      /* Single font: DM Sans — closest free match to Airbnb Cereal */
      fontFamily: {
        'sans':           ['Inter', 'DM Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Helvetica', 'Arial', 'sans-serif'],
        'display':        ['DM Serif Display', 'Georgia', 'serif'],
        'serif':          ['DM Serif Display', 'Georgia', 'serif'],
        'inter':          ['Inter', 'DM Sans', 'sans-serif'],
        'geist':          ['Inter', 'DM Sans', 'sans-serif'],
        'plus-jakarta':   ['Inter', 'DM Sans', 'sans-serif'],
        'poppins':        ['Inter', 'DM Sans', 'sans-serif'],
        'heading':        ['DM Serif Display', 'Georgia', 'serif'],
        'mono':           ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },

      /* ─── COLORS ───────────────────────────────────────── */
      colors: {
        /* ── Brand tokens (route-group scoped via [data-brand="admin"])
              These are the canonical token set used by shared/ primitives.
              Frontend scope → coral. Admin scope → blue. ── */
        brand: {
          DEFAULT: "hsl(var(--brand) / <alpha-value>)",
          hover: "hsl(var(--brand-hover) / <alpha-value>)",
          fg: "hsl(var(--brand-fg) / <alpha-value>)",
          subtle: "hsl(var(--brand-subtle) / <alpha-value>)",
        },

        /* ── designe.md tokens ── */
        ds: {
          sky:     "var(--ds-sky)",
          mist:    "var(--ds-mist)",
          ocean:   "var(--ds-ocean)",
          deep:    "var(--ds-deep)",
          navy:    "var(--ds-navy)",
          sand:    "var(--ds-sand)",
          dune:    "var(--ds-dune)",
          rust:    "var(--ds-rust)",
          lagoon:  "var(--ds-lagoon)",
          palm:    "var(--ds-palm)",
          forest:  "var(--ds-forest)",
          linen:   "var(--ds-linen)",
          pebble:  "var(--ds-pebble)",
          slate:   "var(--ds-slate)",
          charcoal:"var(--ds-charcoal)",
          white:   "var(--ds-white)",
          error:   "var(--ds-error)",
          success: "var(--ds-success)",
          warning: "var(--ds-warning)",
        },

        /* TravelHomes design tokens */
        th: {
          brand:           "var(--th-brand)",
          "brand-hover":   "var(--th-brand-hover)",
          "brand-fg":      "var(--th-brand-fg)",

          /* Logo artwork cyan — theme-independent, see global.css */
          logo:            "var(--th-logo)",
          "logo-fg":       "var(--th-logo-fg)",

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

          cta:             "var(--th-cta)",
          "cta-hover":     "var(--th-cta-hover)",
          "cta-fg":        "var(--th-cta-fg)",

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

          /* Onboarding warm-palette tokens (preserve current colors) */
          "warm-text-dark":  "var(--th-warm-text-dark)",
          "warm-text-muted": "var(--th-warm-text-muted)",
          "warm-border":     "var(--th-warm-border)",
          "warm-border-strong": "var(--th-warm-border-strong)",
          "warm-surface":    "var(--th-warm-surface)",

          "brand-soft":         "var(--th-brand-soft)",
          "brand-border-soft":  "var(--th-brand-border-soft)",

          "error-bright":       "var(--th-error-bright)",
          "error-bright-soft":  "var(--th-error-bright-soft)",
          "error-bright-bg":    "var(--th-error-bright-bg)",
          "error-bright-ring":  "var(--th-error-bright-ring)",

          "success-bright":         "var(--th-success-bright)",
          "success-bright-bg":      "var(--th-success-bright-bg)",
          "success-bright-border":  "var(--th-success-bright-border)",

          "warn-bright":         "var(--th-warn-bright)",
          "warn-bright-bg":      "var(--th-warn-bright-bg)",
          "warn-bright-border":  "var(--th-warn-bright-border)",
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

        /* Pacific Teal-Blue — coastal travel-magazine brand palette */
        ocean: {
          50:  "#e8f2f8",
          100: "#d0e4ef",
          200: "#a8cce0",
          300: "#67b2d8",
          400: "#1e88ba",   /* mid accent, focus rings */
          500: "#0f5c8a",   /* PRIMARY brand — CTAs */
          600: "#14709f",   /* CTA hover (lighter than 500 = "lift on hover") */
          700: "#0a4670",   /* footer, sidebar */
          800: "#0a2b40",   /* ink — hero bg, headings */
          900: "#061e2e",   /* deepest */
        },

        /* Champagne — premium luxury accent (use sparingly: badges, featured, ratings) */
        champagne: {
          50:  "#fbf7ec",
          100: "#f4eee0",
          200: "#ebe0c2",
          300: "#e7d3a6",   /* soft luxury tint */
          400: "#d6ba85",
          500: "#c8a96a",   /* primary champagne fill */
          600: "#a88a4d",
          700: "#8c6f33",   /* contrast-safe text color */
        },

        /* Convenience aliases */
        ink: "#0a2b40",

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

        /* ── NextAdmin template palette (scoped via [data-brand="admin"]) ──
              See admin.css for the CSS-var fallbacks. Using `var(--tpl-*)`
              means `bg-tpl-primary` only renders the template color inside
              the admin shell — public-site pages keep their existing brand. */
        /* Semantic surface/accent layer — see global.css. One shared component
           set themes to both vendor (neutral grays + blue) and admin (tpl
           palette + purple) via these CSS-var-backed tokens. */
        app: {
          surface:        "var(--surface)",
          "surface-2":    "var(--surface-2)",
          border:         "var(--surface-border)",
          fg:             "var(--surface-fg)",
          "fg-muted":     "var(--surface-fg-muted)",
          "fg-subtle":    "var(--surface-fg-subtle)",
          accent:         "var(--accent)",
          "accent-hover": "var(--accent-hover)",
          "accent-soft":  "var(--accent-soft)",
          "accent-fg":    "var(--accent-fg)",
        },
        tpl: {
          primary:       "var(--tpl-primary)",
          "primary-hover":"var(--tpl-primary-hover)",
          "primary-soft": "var(--tpl-primary-soft)",
          stroke:        "var(--tpl-stroke)",
          "body-bg":     "var(--tpl-body-bg)",
          "card-bg":     "var(--tpl-card-bg)",
          dark:          "var(--tpl-dark)",
          "dark-2":      "var(--tpl-dark-2)",
          "dark-3":      "var(--tpl-dark-3)",
          "dark-4":      "var(--tpl-dark-4)",
          "dark-5":      "var(--tpl-dark-5)",
          "dark-6":      "var(--tpl-dark-6)",
          "dark-7":      "var(--tpl-dark-7)",
          "gray-1":      "var(--tpl-gray-1)",
          "gray-2":      "var(--tpl-gray-2)",
          "gray-3":      "var(--tpl-gray-3)",
          "gray-4":      "var(--tpl-gray-4)",
          "gray-5":      "var(--tpl-gray-5)",
          "gray-6":      "var(--tpl-gray-6)",
          "gray-7":      "var(--tpl-gray-7)",
          green:         "var(--tpl-green)",
          "green-light": "var(--tpl-green-light)",
          "green-soft":  "var(--tpl-green-soft)",
          red:           "var(--tpl-red)",
          "red-light":   "var(--tpl-red-light)",
          "red-soft":    "var(--tpl-red-soft)",
          blue:          "var(--tpl-blue)",
          "blue-soft":   "var(--tpl-blue-soft)",
          yellow:        "var(--tpl-yellow)",
          "yellow-soft": "var(--tpl-yellow-soft)",
          orange:        "var(--tpl-orange)",
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
        /* NextAdmin template shadows */
        "tpl-1":    "var(--tpl-shadow-1)",
        "tpl-2":    "var(--tpl-shadow-2)",
        "tpl-card": "var(--tpl-shadow-card)",
        "tpl-card-2": "var(--tpl-shadow-card-2)",
        "th-xs":    "var(--th-shadow-xs)",
        "th-sm":    "var(--th-shadow-sm)",
        "th-md":    "var(--th-shadow-md)",
        "th-lg":    "var(--th-shadow-lg)",
        "th-xl":    "var(--th-shadow-xl)",
        "th-2xl":   "var(--th-shadow-2xl)",
        "th-inner": "var(--th-shadow-inner)",
        "th-ring":  "var(--th-shadow-ring)",
        "th-ring-error": "var(--th-shadow-ring-error)",
        /* Indigo theme shadows */
        "blue-sm":   "0 2px 8px rgba(15,92,138,0.10)",
        "blue-md":   "0 4px 16px rgba(15,92,138,0.15)",
        "blue-lg":   "0 12px 40px rgba(15,92,138,0.20)",
        "blue-glow": "0 0 24px rgba(30,136,186,0.35)",
      },

      /* ─── TRANSITIONS ──────────────────────────────────── */
      transitionTimingFunction: {
        "th-default": "var(--th-ease-default)",
        "th-in":      "var(--th-ease-in)",
        "th-out":     "var(--th-ease-out)",
        "th-spring":  "var(--th-ease-spring)",
        "th-bounce":  "var(--th-ease-bounce)",
        /* Blue theme easing */
        "out-expo":   "cubic-bezier(0.16, 1, 0.3, 1)",
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

      /* ─── FONT SIZE — Airbnb-standard scale ────────────── */
      fontSize: {
        "th-xs":      ["var(--th-text-xs)",   { lineHeight: "1.4",  letterSpacing: "0em"   }], /* 11px */
        "th-sm":      ["var(--th-text-sm)",   { lineHeight: "1.5",  letterSpacing: "-0.005em" }], /* 12px */
        "th-base":    ["var(--th-text-base)", { lineHeight: "1.5",  letterSpacing: "-0.01em"  }], /* 14px */
        "th-md":      ["var(--th-text-md)",   { lineHeight: "1.5",  letterSpacing: "-0.01em"  }], /* 16px */
        "th-lg":      ["var(--th-text-lg)",   { lineHeight: "1.4",  letterSpacing: "-0.015em" }], /* 18px */
        "th-xl":      ["var(--th-text-xl)",   { lineHeight: "1.3",  letterSpacing: "-0.015em" }], /* 22px */
        "th-2xl":     ["var(--th-text-2xl)",  { lineHeight: "1.25", letterSpacing: "-0.02em"  }], /* 28px */
        "th-3xl":     ["var(--th-text-3xl)",  { lineHeight: "1.2",  letterSpacing: "-0.025em" }], /* 36px */
        "th-display": ["var(--th-text-4xl)",  { lineHeight: "1.1",  letterSpacing: "-0.03em"  }], /* 52px */
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
        /* Blue theme keyframes */
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-down": {
          from: { opacity: "0", transform: "translateY(-20px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-scale": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to:   { opacity: "1", transform: "scale(1)" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(30px)" },
          to:   { opacity: "1", transform: "translateX(0)" },
        },
        "slide-in-left": {
          from: { opacity: "0", transform: "translateX(-30px)" },
          to:   { opacity: "1", transform: "translateX(0)" },
        },
        "subtle-bounce": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%":      { transform: "translateY(-6px)" },
        },
        "shimmer": {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0.7" },
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
        /* Blue theme animations */
        "fade-in-up":       "fade-in-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) both",
        "fade-in-down":     "fade-in-down 0.5s cubic-bezier(0.16, 1, 0.3, 1) both",
        "fade-in-scale":    "fade-in-scale 0.4s cubic-bezier(0.16, 1, 0.3, 1) both",
        "slide-in-right":   "slide-in-right 0.5s cubic-bezier(0.16, 1, 0.3, 1) both",
        "slide-in-left":    "slide-in-left 0.5s cubic-bezier(0.16, 1, 0.3, 1) both",
        "subtle-bounce":    "subtle-bounce 2s ease-in-out infinite",
        "shimmer":          "shimmer 2s infinite",
        "pulse-soft":       "pulse-soft 2s ease-in-out infinite",
      },

      /* ─── GRID (existing) ──────────────────────────────── */
      gridTemplateColumns: {
        '16': 'repeat(16, minmax(0, 1fr))',
        'calendar': '231px repeat(15, 60px)',
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    // `short:` — viewport not tall enough to show the hero + first card row
    // together on a normal laptop window. Added via addVariant (not
    // theme.screens) because a non-numeric `raw` screen entry breaks
    // Tailwind's max-* variant generation sitewide. Always pair with a width
    // breakpoint (e.g. `lg:short:`) — alone it would also match short
    // *phones*, which already use an entirely different mobile hero layout.
    plugin(({ addVariant }) => {
      addVariant("short", "@media (max-height: 820px)");
    }),
  ],
} satisfies Config;

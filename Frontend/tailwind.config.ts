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
      fontFamily: {
        'plus-jakarta': ['Plus Jakarta Sans', 'sans-serif'],
        'geist': ['Inter', 'sans-serif'],
        'poppins': ['Poppins', 'sans-serif'],
      },
      colors: {
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
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      gridTemplateColumns: {
        '16': 'repeat(16, minmax(0, 1fr))',
        'calendar': '231px repeat(15, 60px)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

import tailwindcssAnimate from "tailwindcss-animate";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
        display: ['"IBM Plex Serif"', 'ui-serif', 'Georgia', 'serif'],
        sans: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        // Warm ink scale (near-black → smoke). These power the surfaces.
        ink: {
          0: '#08070a',
          50: '#0d0c10',
          100: '#121017',
          200: '#18161e',
          300: '#1f1c26',
          400: '#2b2732',
          500: '#3a3543',
          600: '#514a5c',
          700: '#6f6679',
          800: '#948ca0',
          900: '#c4bdcf',
        },
        // Warm paper scale — off-whites with a tan underbelly.
        paper: {
          0: '#f7f1e1',
          50: '#efe8d2',
          100: '#e3d9bf',
          200: '#d1c6a8',
          300: '#b9ad8c',
          400: '#9a8f70',
          500: '#7a7159',
        },
        // The signal. Used sparingly: live run state, accents, key CTAs.
        signal: {
          50: '#fff2e0',
          100: '#ffdca6',
          200: '#ffbf66',
          300: '#ff9d2b',
          400: '#f5841a',
          500: '#e07112',
          600: '#b8590a',
          700: '#8a4108',
        },
        alert: {
          400: '#e85a3c',
          500: '#c74525',
          600: '#9a3218',
        },
        go: {
          400: '#8fbd7a',
          500: '#6ea25c',
          600: '#517f43',
        },
        wait: {
          400: '#d4b257',
          500: '#b89438',
          600: '#8f6f24',
        },
        // shadcn semantic passthroughs pointed at HSL vars
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
      },
      borderRadius: {
        none: "0px",
        sm: "1px",
        DEFAULT: "2px",
        md: "2px",
        lg: "3px",
        xl: "4px",
        full: "9999px",
      },
      letterSpacing: {
        stamp: "0.22em",
        wide: "0.08em",
      },
      boxShadow: {
        panel: "0 1px 0 0 rgba(247, 241, 225, 0.04), inset 0 0 0 1px rgba(247, 241, 225, 0.06)",
        glow: "0 0 0 1px rgba(245, 132, 26, 0.25), 0 0 24px -4px rgba(245, 132, 26, 0.35)",
      },
      keyframes: {
        "signal-pulse": {
          "0%, 100%": { opacity: "1", boxShadow: "0 0 0 0 rgba(245, 132, 26, 0.6)" },
          "50%": { opacity: "0.55", boxShadow: "0 0 0 6px rgba(245, 132, 26, 0)" },
        },
        "scan": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        "stamp-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "blink": {
          "0%, 49%": { opacity: "1" },
          "50%, 100%": { opacity: "0" },
        },
      },
      animation: {
        "signal-pulse": "signal-pulse 1.6s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "scan": "scan 6s linear infinite",
        "stamp-in": "stamp-in 0.5s ease-out both",
        "blink": "blink 1.1s steps(1) infinite",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

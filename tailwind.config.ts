import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
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
        // Status colors
        status: {
          available: "hsl(var(--status-available))",
          busy: "hsl(var(--status-busy))",
          pending: "hsl(var(--status-pending))",
          paid: "hsl(var(--status-paid))",
          sent: "hsl(var(--status-sent))",
        },
        // Neon gradient helpers used in CSS
        "neon-purple": "hsl(263 70% 65%)",
        "neon-blue": "hsl(217 91% 60%)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-primary': 'var(--gradient-primary)',
        'gradient-card': 'var(--gradient-card)',
      },
      boxShadow: {
        'glow': 'var(--shadow-glow)',
        'glass': 'var(--shadow-glass)',
      },
      backdropBlur: {
        'glass': '20px',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "glass-shine": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        "glass-shine": "glass-shine 2s ease-in-out infinite",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    function({ addComponents }) {
      addComponents({
        '.glass-card': {
          backgroundColor: 'hsl(var(--glass-bg))',
          backdropFilter: 'blur(20px)',
          border: '1px solid hsl(var(--glass-border))',
          boxShadow: 'var(--shadow-glass)',
        },
        '.glass-button': {
          backgroundColor: 'hsl(var(--glass-bg))',
          backdropFilter: 'blur(10px)',
          border: '1px solid hsl(var(--glass-border))',
          transition: 'var(--transition-smooth)',
          '&:hover': {
            backgroundColor: 'hsl(var(--primary) / 0.1)',
            boxShadow: 'var(--shadow-glow)',
          }
        },
        // Helpers used by new CSS
        '.bg-glass-white': {
          backgroundColor: 'hsl(0 0% 100% / 0.05)'
        },
        '.border-glass-border': {
          borderColor: 'hsl(0 0% 100% / 0.10)'
        },
        '.brand-instagram': {
          color: 'hsl(340 77% 54%)'
        },
        '.brand-youtube': {
          color: 'hsl(0 100% 50%)'
        },
        '.brand-soundcloud': {
          color: 'hsl(20 100% 50%)'
        },
        '.status-available': {
          backgroundColor: 'hsl(var(--status-available) / 0.2)',
          color: 'hsl(var(--status-available))',
          borderColor: 'hsl(var(--status-available) / 0.3)',
        },
        '.status-busy': {
          backgroundColor: 'hsl(var(--status-busy) / 0.2)',
          color: 'hsl(var(--status-busy))',
          borderColor: 'hsl(var(--status-busy) / 0.3)',
        },
        '.status-pending': {
          backgroundColor: 'hsl(var(--status-pending) / 0.2)',
          color: 'hsl(var(--status-pending))',
          borderColor: 'hsl(var(--status-pending) / 0.3)',
        },
        '.status-paid': {
          backgroundColor: 'hsl(var(--status-paid) / 0.2)',
          color: 'hsl(var(--status-paid))',
          borderColor: 'hsl(var(--status-paid) / 0.3)',
        },
        '.status-sent': {
          backgroundColor: 'hsl(var(--status-sent) / 0.2)',
          color: 'hsl(var(--status-sent))',
          borderColor: 'hsl(var(--status-sent) / 0.3)',
        },
      })
    }
  ],
} satisfies Config;

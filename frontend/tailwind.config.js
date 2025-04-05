// tailwind.config.js
module.exports = {
  darkMode: ["class"],
  content: [
    './src/**/*.{html,js,jsx,ts,tsx,vue}',
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  safelist: [
    'bg-gradient-to-r',
    'bg-indigo-600',
    'bg-violet-600',
    'hover:bg-indigo-700',
    'text-white',
    'font-medium',
    'py-3',
    'px-6',
    'rounded-full',
    'transition-all',
    'duration-300',
    'shadow-lg',
    'hover:shadow-xl',
    'transform',
    'hover:-translate-y-0.5',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px'
      }
    },
    // Define custom breakpoints for mobile-first approach
    screens: {
      'xs': '375px',     // Small phones
      'sm': '640px',     // Large phones
      'md': '768px',     // Tablets
      'lg': '1024px',    // Laptops/Desktops
      'xl': '1280px',    // Large Desktops
      '2xl': '1536px',   // Extra Large Screens
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
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(at 50% 50%, var(--tw-gradient-stops))',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      maxHeight: {
        '3/4-screen': '75vh',
      },
      fontSize: {
        'xxs': '0.65rem',
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
        'wave': {
          '0%': { transform: 'translateY(10px)' },
          '50%': { transform: 'translateY(-10px)' },
          '100%': { transform: 'translateY(10px)' }
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.8)', opacity: '0.8' },
          '50%': { transform: 'scale(1)', opacity: '0.4' },
          '100%': { transform: 'scale(0.8)', opacity: '0.8' }
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        'fade-out': {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' }
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        'wave': 'wave 2s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 1.5s ease-out infinite',
        'fade-in': 'fade-in 0.5s ease-out',
        'fade-out': 'fade-out 0.5s ease-out'
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

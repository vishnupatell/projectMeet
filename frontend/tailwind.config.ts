import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-manrope)", ...defaultTheme.fontFamily.sans],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          50: "#EAF6F8",
          100: "#D1EAF0",
          200: "#A2D4E0",
          300: "#6AB8CB",
          400: "#3A9AB1",
          500: "#0F758C",
          600: "#0D6174",
          700: "#0A4E5E",
          800: "#073B47",
          900: "#052A33",
        },
        mist: {
          50: "#FAFCFD",
          100: "#F4F8FA",
          150: "#EDF3F6",
          200: "#E3ECF0",
          300: "#CBD8DE",
          500: "#7A8E97",
        },
        ink: {
          900: "#0E161A",
          800: "#162228",
          700: "#1F3138",
          400: "#68818B",
        },
        blue: {
          50: "#EAF6F8",
          100: "#D1EAF0",
          200: "#A2D4E0",
          300: "#6AB8CB",
          400: "#3A9AB1",
          500: "#0F758C",
          600: "#0D6174",
          700: "#0A4E5E",
          800: "#073B47",
          900: "#052A33",
        },
      },
      boxShadow: {
        soft: "0 10px 30px -18px rgba(7, 59, 71, 0.55)",
        card: "0 8px 26px -16px rgba(10, 47, 56, 0.35)",
        glass: "0 1px 0 rgba(255,255,255,0.35) inset, 0 16px 32px -20px rgba(5, 42, 51, 0.4)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};
export default config;

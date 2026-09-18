import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: { DEFAULT: "#faf7f2", 50: "#fdfcfa", 100: "#faf7f2", 200: "#f2ece1", 300: "#e6dccb" },
        ink: { DEFAULT: "#1f1d1a", soft: "#4a4640", muted: "#7a746a" },
        emerald: { DEFAULT: "#0f5d4a", dark: "#0a4436", light: "#e3f1ec" },
        gold: { DEFAULT: "#b8862b", light: "#f6ecd6" },
        line: "#e6dfd2",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(31,29,26,.04), 0 8px 24px -8px rgba(31,29,26,.10)",
        lift: "0 2px 4px rgba(31,29,26,.05), 0 16px 36px -12px rgba(31,29,26,.18)",
      },
    },
  },
  plugins: [],
};
export default config;

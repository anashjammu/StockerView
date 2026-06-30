import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        terminal: {
          bg: "#070b1a",
          panel: "#101827",
          panel2: "#152238",
          line: "#24344f",
          amber: "#f6c768",
          cyan: "#38d9ff",
          green: "#6ee7b7",
          red: "#fb7185",
          text: "#f8fbff",
          muted: "#9aa8bd"
        }
      },
      fontFamily: {
        mono: ["var(--font-geist-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
        sans: ["var(--font-geist-sans)", "Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      boxShadow: {
        glow: "0 24px 80px rgba(0,0,0,0.35)"
      }
    }
  },
  plugins: []
};

export default config;

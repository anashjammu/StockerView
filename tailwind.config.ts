import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        terminal: {
          bg: "#f7f9fc",
          panel: "#ffffff",
          panel2: "#f8fbff",
          line: "#d6deea",
          amber: "#b87a1d",
          cyan: "#2f80a3",
          green: "#2f8a57",
          red: "#b6495f",
          text: "#111827",
          muted: "#5f6b7d"
        }
      },
      fontFamily: {
        mono: ["var(--font-geist-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
        sans: ["var(--font-geist-sans)", "Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      boxShadow: {
        glow: "0 18px 38px rgba(15, 23, 42, 0.10)"
      }
    }
  },
  plugins: []
};

export default config;

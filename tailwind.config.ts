import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        cream: "#fff8ea",
        ivory: "#fffdf6",
        tan: "#d7bd95",
        clay: "#b98262",
        cocoa: "#5b3d2e",
        bark: "#3f2b21",
        sage: "#c9dcc4",
        forest: "#5c7f63",
        lilac: "#d8c7e8",
        plum: "#705271"
      },
      boxShadow: {
        soft: "0 14px 35px rgba(91, 61, 46, 0.12)",
        title: "0 10px 22px rgba(92, 127, 99, 0.22)"
      },
      fontFamily: {
        sans: ["var(--font-body)", "ui-sans-serif", "system-ui"],
        bubble: ["var(--font-title)", "Trebuchet MS", "ui-sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;

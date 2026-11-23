/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        canvas: "#F4F7F4",
        surface: "#FFFFFF",
        "border-subtle": "#CBD7CD",
        "border-strong": "#334E39",
        "text-primary": "#0A1C10",
        "text-muted": "#2D4233",
        primary: {
          DEFAULT: "#0B5A25",
          contrast: "#FFFFFF",
          light: "#D8F2E6",
        },
        secondary: {
          DEFAULT: "#0D47A1",
          light: "#DCEBFA",
        },
        gold: {
          DEFAULT: "#8F5300",
          bg: "#FFF3D6",
          dark: "#5E3600",
        },
        urgent: {
          DEFAULT: "#A31610",
          bg: "#FDE8E7",
        },
        cabinet: "#1A3B28",
      },
      fontFamily: {
        sans: ["AtkinsonHyperlegible_400Regular", "system-ui", "sans-serif"],
        bold: ["AtkinsonHyperlegible_700Bold", "system-ui", "sans-serif"],
      },
      fontSize: {
        caption: ["17px", { lineHeight: "22px" }],
        body: ["20px", { lineHeight: "26px" }],
        "title-md": ["24px", { lineHeight: "30px" }],
        "title-lg": ["28px", { lineHeight: "34px" }],
        display: ["34px", { lineHeight: "40px" }],
      },
      minHeight: {
        touch: "56px",
        "touch-lg": "64px",
      },
      borderRadius: {
        card: "16px",
        btn: "14px",
      },
    },
  },
  plugins: [],
};

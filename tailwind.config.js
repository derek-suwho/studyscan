/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          900: "#1a1a2e",
          800: "#232340",
          700: "#2e2e52",
          600: "#3a3a64",
        },
        amber: {
          accent: "#d4a853",
          light: "#f0ddb0",
        },
        surface: {
          50: "#fafaf8",
          100: "#f5f4f0",
          200: "#eceae4",
        },
      },
      fontFamily: {
        display: ['"Instrument Serif"', "Georgia", "serif"],
        body: ['"DM Sans"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(26,26,46,0.06), 0 6px 16px rgba(26,26,46,0.04)",
        "card-hover":
          "0 2px 6px rgba(26,26,46,0.08), 0 10px 24px rgba(26,26,46,0.06)",
        elevated:
          "0 4px 12px rgba(26,26,46,0.08), 0 16px 32px rgba(26,26,46,0.06)",
      },
    },
  },
  plugins: [],
};

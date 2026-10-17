/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#FBF7F0",
        navy: "#1E2761",
        copper: "#C98B4A",
        tint: "#EEF1FB",
        teal: "#2E8B7A",
        amber: "#D99A2B",
        brick: "#B8493F",
        ice: "#CADCFC",
      },
      fontFamily: {
        display: ["Fraunces", "Cambria", "serif"],
        sans: ["DM Sans", "Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};

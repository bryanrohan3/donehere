export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      keyframes: {
        "fade-in": {
          "0%": { opacity: 0, transform: "translateY(10px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        puff: {
          "0%": { opacity: 1, transform: "translateY(0) scale(1)" },
          "100%": { opacity: 0, transform: "translateY(-60px) scale(1.6)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out",
        puff: "puff 0.6s ease-out forwards",
      },
    },
  },
  plugins: [],
};

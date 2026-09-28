/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        synapse: {
          navy: "#0f172a",
          teal: "#0d9488",
          coral: "#f97316",
          cream: "#fefce8",
        },
      },
    },
  },
  plugins: [],
};

const colors = require("tailwindcss/colors")

module.exports = {
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        blue: colors.sky,
        gray: colors.slate,
      },
    },
  },
  plugins: [],
}

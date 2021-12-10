const colors = require("tailwindcss/colors")

module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        blue: colors.sky,
        green: colors.emerald,
        yellow: colors.amber,
        gray: colors.slate,
      },
    },
  },
}

const colors = require("tailwindcss/colors")

module.exports = {
  purge: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  darkMode: "media",
  theme: {
    colors: {
      blue: colors.lightBlue,
      green: colors.green,
      red: colors.red,
      yellow: colors.yellow,
      gray: colors.blueGray,
      white: colors.white,
    },
  },
  variants: {
    extend: {
      ringWidth: ["focus-visible"],
      ringColor: ["focus-visible"],
      ringOffsetWidth: ["focus-visible"],
      ringOffsetColor: ["focus-visible"],
      outline: ["focus-visible"],
    },
  },
}

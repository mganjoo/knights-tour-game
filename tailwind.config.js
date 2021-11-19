const colors = require("tailwindcss/colors")

module.exports = {
  mode: "jit",
  purge: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  darkMode: "media",
  theme: {
    colors: {
      transparent: "transparent",
      blue: colors.sky,
      green: colors.green,
      red: colors.red,
      yellow: colors.yellow,
      gray: colors.blueGray,
      white: colors.white,
    },
  },
}

const colors = require("tailwindcss/colors")

module.exports = {
  mode: "jit",
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
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

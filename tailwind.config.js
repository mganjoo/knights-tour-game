const colors = require("tailwindcss/colors")

module.exports = {
  purge: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  darkMode: "media",
  theme: {
    extend: {
      colors: {
        "light-blue": colors.lightBlue,
        "blue-gray": colors.blueGray,
      },
    },
  },
}

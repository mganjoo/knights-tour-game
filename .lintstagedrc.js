module.exports = {
  "**/*.{js,jsx,ts,tsx}": "eslint --cache --fix",
  "**/*.{js,jsx,ts,tsx,json,css,scss,md,yml}": ["prettier --write"],
}

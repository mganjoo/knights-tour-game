module.exports = {
  "**/*.{js,jsx,mjs,cjs,ts,mts,tsx}": "eslint --cache --fix",
  "**/*.{js,jsx,mjs,cjs,ts,mts,tsx,json,css,scss,md,yml}": ["prettier --write"],
}

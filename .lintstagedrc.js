module.exports = {
  "**/*.js?(x)": (filenames) =>
    `next lint --fix --file ${filenames
      .map((file) => file.split(process.cwd())[1])
      .join(" --file ")}`,
  "**/*.{js,jsx,ts,tsx,json,css,scss,md,yml}": ["prettier --write"],
}

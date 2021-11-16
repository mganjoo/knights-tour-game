import preval from "preval.macro"

/**
 * Export resolved Tailwind config (such as colors)
 */
export const colors: any = preval`
const myConfig = require("../../tailwind.config.js")
const resolveConfig = require("tailwindcss/resolveConfig")
const fullConfig = resolveConfig(myConfig)
module.exports = fullConfig.theme.colors
`

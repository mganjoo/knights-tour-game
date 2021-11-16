import preval from "preval.macro"
// eslint-disable-next-line
import { TailwindColorGroup } from "tailwindcss/tailwind-config"

/**
 * Export resolved Tailwind config (such as colors)
 */
export const colors: TailwindColorGroup = preval`
const myConfig = require("../../tailwind.config.js")
const resolveConfig = require("tailwindcss/resolveConfig")
const fullConfig = resolveConfig(myConfig)
module.exports = fullConfig.theme.colors
`

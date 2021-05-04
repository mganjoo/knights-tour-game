import preval from "preval.macro"
import { TailwindConfig } from "tailwindcss/tailwind-config"

export const myConfig: TailwindConfig = preval`
const myConfig = require("../tailwind.config.js")
const resolveConfig = require("tailwindcss/resolveConfig")
const fullConfig = resolveConfig(myConfig)
module.exports = fullConfig
`

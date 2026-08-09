import js from "@eslint/js"
import prettier from "eslint-config-prettier"
import cypress from "eslint-plugin-cypress"
import importPlugin from "eslint-plugin-import"
import reactHooks from "eslint-plugin-react-hooks"
import globals from "globals"
import tseslint from "typescript-eslint"

export default tseslint.config(
  { ignores: ["dist/", "coverage/"] },
  js.configs.recommended,
  tseslint.configs.recommended,
  importPlugin.flatConfigs.recommended,
  importPlugin.flatConfigs.typescript,
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,tsx}"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      "import/order": ["error", { alphabetize: { order: "asc" } }],
      // tsc already resolves every import, and does it correctly for packages
      // that only publish an "exports" map (vite, vitest). This rule's own
      // resolver does not, so it only produces false positives here.
      "import/no-unresolved": "off",
      // A leading underscore marks a deliberately unused binding.
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      // Used as a deliberate escape hatch for custom-element refs and xstate
      // internals; worth seeing, not worth blocking on.
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  {
    // Tailwind and PostCSS load these as CommonJS.
    files: ["**/*.config.js", ".lintstagedrc.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  {
    // Matches what eslint-config-react-app enforced before the Vite migration.
    // The rest of this plugin's recommended set is React Compiler rules, which
    // this codebase has not been audited against.
    files: ["src/**/*.{ts,tsx}"],
    plugins: { "react-hooks": reactHooks },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
  {
    files: ["src/**/*.test.ts", "src/setupTests.ts"],
    languageOptions: {
      globals: {
        afterAll: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        beforeEach: "readonly",
        describe: "readonly",
        expect: "readonly",
        it: "readonly",
        test: "readonly",
        vi: "readonly",
      },
    },
  },
  {
    files: ["cypress/**/*.ts", "cypress.config.ts"],
    ...cypress.configs.recommended,
  },
  prettier
)

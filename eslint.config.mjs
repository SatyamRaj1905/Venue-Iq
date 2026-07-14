import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";
import promise from "eslint-plugin-promise";

export default defineConfig([
  ...nextCoreWebVitals,
  ...nextTypeScript,
  promise.configs["flat/recommended"],
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      complexity: ["warn", 16],
      "max-lines": ["warn", { max: 1200, skipBlankLines: true, skipComments: true }],
      "max-lines-per-function": ["warn", { max: 120, skipBlankLines: true, skipComments: true }],
      "promise/always-return": "off",
      "promise/catch-or-return": "off",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
    },
  },
  {
    files: ["tests/**/*.{ts,tsx}", "**/*.test.{ts,tsx}"],
    rules: {
      "max-lines-per-function": "off",
    },
  },
  {
    files: ["src/lib/domain/routing.ts"],
    rules: {
      complexity: ["warn", 24],
    },
  },
  {
    files: ["src/lib/domain/simulation.ts"],
    rules: {
      "max-lines-per-function": ["warn", { max: 300, skipBlankLines: true, skipComments: true }],
    },
  },
  globalIgnores([
    ".next/**",
    "coverage/**",
    "node_modules/**",
    "playwright-report/**",
    "test-results/**",
    "next-env.d.ts",
  ]),
]);

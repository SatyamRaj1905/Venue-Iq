import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/{unit,components,integration}/**/*.test.{ts,tsx}"],
    exclude: ["tests/e2e/**", "tests/accessibility/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "html", "lcov"],
      include: [
        "src/lib/domain/**/*.ts",
        "src/lib/ai/{fallback,schemas,tools}.ts",
        "src/lib/security/{requestValidation,safeErrors,trustedOrigin}.ts",
      ],
      exclude: ["**/*.d.ts", "**/types.ts", "**/index.ts"],
      thresholds: {
        lines: 90,
        functions: 90,
        statements: 90,
        branches: 85,
      },
    },
  },
});

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: [
      "packages/*/tests/**/*.test.ts",
      "tests/smoke/**/*.test.ts",
    ],
    passWithNoTests: false,
    reporters: ["default"],
  },
});


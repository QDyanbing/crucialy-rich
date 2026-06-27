import { defineConfig } from "vitest/config";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@crucialy-rich/core": fileURLToPath(
        new URL("./packages/core/src/index.ts", import.meta.url),
      ),
      "@crucialy-rich/react": fileURLToPath(
        new URL("./packages/react/src/index.ts", import.meta.url),
      ),
    },
  },
  test: {
    environment: "node",
    include: ["packages/*/tests/**/*.test.ts", "tests/smoke/**/*.test.ts"],
    passWithNoTests: false,
    reporters: ["default"],
  },
});

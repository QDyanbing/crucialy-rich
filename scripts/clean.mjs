import { rm } from "node:fs/promises";
import { URL } from "node:url";

const generatedPaths = [
  "apps/demo/dist",
  "apps/demo/dist-types",
  "coverage",
  "packages/core/dist",
  "packages/react/dist",
  "playwright-report",
  "test-results",
];

await Promise.all(
  generatedPaths.map((path) =>
    rm(new URL(`../${path}`, import.meta.url), {
      force: true,
      recursive: true,
    }),
  ),
);

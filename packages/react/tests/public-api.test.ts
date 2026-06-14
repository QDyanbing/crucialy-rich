import { describe, expect, it } from "vitest";

import * as reactPackage from "../src/index";

describe("@crucialy-rich/react public API", () => {
  it("exposes an importable package entry", () => {
    expect(reactPackage).toBeDefined();
  });
});

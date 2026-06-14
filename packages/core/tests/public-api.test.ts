import { describe, expect, it } from "vitest";

import * as core from "../src/index";

describe("@crucialy-rich/core public API", () => {
  it("exposes an importable package entry", () => {
    expect(core).toBeDefined();
  });
});


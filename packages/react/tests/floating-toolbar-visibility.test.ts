import { describe, expect, it } from "vitest";

import { isFloatingToolbarVisible } from "../src";

describe("isFloatingToolbarVisible", () => {
  it("shows for forward and backward ranges", () => {
    expect(
      isFloatingToolbarVisible({
        anchor: { offset: 0, path: [0, 0] },
        focus: { offset: 2, path: [0, 0] },
      }),
    ).toBe(true);
    expect(
      isFloatingToolbarVisible({
        anchor: { offset: 2, path: [0, 0] },
        focus: { offset: 0, path: [0, 0] },
      }),
    ).toBe(true);
  });

  it("hides for collapsed or missing selections", () => {
    expect(
      isFloatingToolbarVisible({
        anchor: { offset: 1, path: [0, 0] },
        focus: { offset: 1, path: [0, 0] },
      }),
    ).toBe(false);
    expect(isFloatingToolbarVisible()).toBe(false);
  });
});

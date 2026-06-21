import { describe, expect, it } from "vitest";

import { compareRange, isCollapsed, normalizeRange } from "../../src/selection/range";
import type { RangeSelection } from "../../src/selection/types";

describe("range selection", () => {
  it("detects collapsed selections", () => {
    expect(
      isCollapsed({
        anchor: { path: [0, 0], offset: 2 },
        focus: { path: [0, 0], offset: 2 },
      }),
    ).toBe(true);
  });

  it("keeps forward ranges unchanged", () => {
    const selection: RangeSelection = {
      anchor: { path: [0, 0], offset: 1 },
      focus: { path: [0, 1], offset: 2 },
    };

    expect(normalizeRange(selection)).toBe(selection);
  });

  it("flips backward ranges", () => {
    expect(
      normalizeRange({
        anchor: { path: [1, 0], offset: 2 },
        focus: { path: [0, 0], offset: 1 },
      }),
    ).toEqual({
      anchor: { path: [0, 0], offset: 1 },
      focus: { path: [1, 0], offset: 2 },
    });
  });

  it("compares normalized ranges", () => {
    expect(
      compareRange(
        {
          anchor: { path: [0, 1], offset: 0 },
          focus: { path: [0, 0], offset: 0 },
        },
        {
          anchor: { path: [0, 0], offset: 0 },
          focus: { path: [0, 1], offset: 1 },
        },
      ),
    ).toBe(-1);
  });
});

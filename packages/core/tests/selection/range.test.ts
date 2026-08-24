import { describe, expect, it } from "vitest";

import {
  cloneRangeSelection,
  compareRange,
  isCollapsed,
  normalizeRange,
} from "../../src/selection/range";
import type { RangeSelection } from "../../src/selection/types";

describe("range selection", () => {
  it("clones directional selections without sharing path references", () => {
    const selection: RangeSelection = {
      anchor: { path: [1, 2], offset: 3 },
      focus: { path: [0, 1], offset: 4 },
    };
    const snapshot = cloneRangeSelection(selection);

    selection.anchor.path[0] = 9;
    selection.focus.path.push(8);

    expect(snapshot).toEqual({
      anchor: { path: [1, 2], offset: 3 },
      focus: { path: [0, 1], offset: 4 },
    });
    expect(snapshot.anchor.path).not.toBe(selection.anchor.path);
    expect(snapshot.focus.path).not.toBe(selection.focus.path);
  });

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

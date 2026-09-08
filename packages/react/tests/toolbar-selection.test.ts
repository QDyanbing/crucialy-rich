import { describe, expect, it } from "vitest";

import { createToolbarSelectionSnapshot } from "../src";

describe("createToolbarSelectionSnapshot", () => {
  it("clones both selection points and paths", () => {
    const selection = {
      anchor: { offset: 0, path: [0, 0] },
      focus: { offset: 3, path: [0, 1] },
    };
    const snapshot = createToolbarSelectionSnapshot(selection);

    expect(snapshot).toEqual(selection);
    expect(snapshot).not.toBe(selection);
    expect(snapshot?.anchor).not.toBe(selection.anchor);
    expect(snapshot?.anchor.path).not.toBe(selection.anchor.path);
    expect(snapshot?.focus.path).not.toBe(selection.focus.path);
  });

  it("keeps a missing selection missing", () => {
    expect(createToolbarSelectionSnapshot()).toBeUndefined();
  });
});

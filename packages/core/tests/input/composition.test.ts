import { describe, expect, it } from "vitest";

import {
  cancelComposition,
  createCompositionState,
  startComposition,
  updateComposition,
} from "../../src";

function createSelection() {
  return {
    anchor: { path: [0, 0], offset: 1 },
    focus: { path: [0, 0], offset: 1 },
  };
}

describe("composition state", () => {
  it("starts inactive", () => {
    expect(createCompositionState()).toEqual({ active: false, data: "" });
  });

  it("captures independent start and current selections", () => {
    const selection = createSelection();
    const state = startComposition(selection);

    selection.anchor.path[0] = 9;

    expect(state).toEqual({
      active: true,
      data: "",
      selection: {
        anchor: { path: [0, 0], offset: 1 },
        focus: { path: [0, 0], offset: 1 },
      },
      startSelection: {
        anchor: { path: [0, 0], offset: 1 },
        focus: { path: [0, 0], offset: 1 },
      },
    });
  });

  it("updates candidate data and the current selection", () => {
    const state = startComposition(createSelection());
    const nextSelection = {
      anchor: { path: [0, 0], offset: 2 },
      focus: { path: [0, 0], offset: 2 },
    };
    const next = updateComposition(state, "中文", nextSelection);

    expect(next.data).toBe("中文");
    expect(next.selection).toEqual(nextSelection);
    expect(next.startSelection).toEqual(state.startSelection);
  });

  it("ignores updates outside an active composition", () => {
    const state = createCompositionState();

    expect(updateComposition(state, "中文")).toBe(state);
  });

  it("clears all transient data when canceled", () => {
    expect(cancelComposition()).toEqual(createCompositionState());
  });
});

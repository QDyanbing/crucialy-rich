import { describe, expect, it } from "vitest";

import {
  cancelComposition,
  createCompositionState,
  finishComposition,
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

  it("finishes with the final event data and start selection", () => {
    const state = updateComposition(startComposition(createSelection()), "中", {
      anchor: { path: [0, 0], offset: 2 },
      focus: { path: [0, 0], offset: 2 },
    });

    expect(finishComposition(state, "中文")).toEqual({
      data: "中文",
      selection: createSelection(),
    });
  });

  it("uses the latest candidate after composition Backspace", () => {
    const state = updateComposition(
      updateComposition(startComposition(createSelection()), "中文"),
      "中",
    );

    expect(finishComposition(state)?.data).toBe("中");
  });

  it("does not commit canceled or empty composition", () => {
    expect(finishComposition(createCompositionState(), "中文")).toBeUndefined();
    expect(finishComposition(startComposition(createSelection()), "")).toBeUndefined();
  });
});

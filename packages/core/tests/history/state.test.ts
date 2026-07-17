import { describe, expect, it } from "vitest";

import { clearHistory, createHistoryState, type HistoryEntry } from "../../src";

function createEntry(batch?: string): HistoryEntry {
  const entry: HistoryEntry = {
    after: {
      document: { type: "document", children: [] },
    },
    before: {
      document: { type: "document", children: [] },
    },
    transaction: {
      operations: [],
    },
  };

  return batch ? { ...entry, batch } : entry;
}

describe("createHistoryState", () => {
  it("creates empty undo and redo stacks by default", () => {
    expect(createHistoryState()).toEqual({
      redoStack: [],
      undoStack: [],
    });
  });

  it("clones stack arrays when creating state", () => {
    const undoStack = [createEntry("typing")];
    const redoStack = [createEntry("redo")];
    const state = createHistoryState(undoStack, redoStack);

    undoStack.push(createEntry("external"));
    redoStack.length = 0;

    expect(state.undoStack).toHaveLength(1);
    expect(state.redoStack).toHaveLength(1);
  });
});

describe("clearHistory", () => {
  it("returns an empty history state", () => {
    expect(clearHistory()).toEqual(createHistoryState());
  });
});

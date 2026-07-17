import { describe, expect, it } from "vitest";

import {
  canRedo,
  canUndo,
  createHistoryState,
  getRedoEntry,
  getUndoEntry,
  type HistoryEntry,
} from "../../src";

function createEntry(batch: string): HistoryEntry {
  return {
    after: {
      document: { type: "document", children: [] },
    },
    batch,
    before: {
      document: { type: "document", children: [] },
    },
    transaction: {
      operations: [],
    },
  };
}

describe("history query helpers", () => {
  it("reads undo and redo availability", () => {
    expect(canUndo(createHistoryState())).toBe(false);
    expect(canRedo(createHistoryState())).toBe(false);

    expect(canUndo(createHistoryState([createEntry("undo")]))).toBe(true);
    expect(canRedo(createHistoryState([], [createEntry("redo")]))).toBe(true);
  });

  it("returns the latest undo and redo entries", () => {
    const firstUndo = createEntry("first-undo");
    const latestUndo = createEntry("latest-undo");
    const latestRedo = createEntry("latest-redo");
    const history = createHistoryState([firstUndo, latestUndo], [latestRedo]);

    expect(getUndoEntry(history)).toBe(latestUndo);
    expect(getRedoEntry(history)).toBe(latestRedo);
  });
});

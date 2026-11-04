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

  it.each(["undoStack", "redoStack"] as const)(
    "isolates entry contents in %s from the supplied entries",
    (stack) => {
      const entry = createEntry("typing");
      const state = createHistoryState(
        stack === "undoStack" ? [entry] : [],
        stack === "redoStack" ? [entry] : [],
      );
      const expected = structuredClone(state);

      entry.batch = "changed";
      entry.after.document.children.push({
        type: "paragraph",
        children: [{ type: "text", text: "污染" }],
      });
      expect(state).toEqual(expected);
      state[stack][0]!.before.document.children.push({
        type: "paragraph",
        children: [{ type: "text", text: "反向修改" }],
      });
      expect(entry.before.document.children).toEqual([]);
    },
  );
});

describe("clearHistory", () => {
  it("returns an empty history state", () => {
    expect(clearHistory()).toEqual(createHistoryState());
  });
});

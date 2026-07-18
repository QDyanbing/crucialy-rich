import { describe, expect, it } from "vitest";

import {
  createDocument,
  createHistorySnapshot,
  createHistoryState,
  createInsertTextOperation,
  createParagraph,
  createText,
  createTransaction,
  undoHistory,
  type HistoryEntry,
} from "../../src";

function createSnapshot(text: string) {
  return createHistorySnapshot(createDocument([createParagraph([createText(text)])]), {
    anchor: { path: [0, 0], offset: text.length },
    focus: { path: [0, 0], offset: text.length },
  });
}

function createEntry(before: string, after: string): HistoryEntry {
  return {
    after: createSnapshot(after),
    before: createSnapshot(before),
    transaction: createTransaction([
      createInsertTextOperation({ path: [0, 0], offset: before.length }, after),
    ]),
  };
}

describe("undoHistory", () => {
  it("returns undefined when undo stack is empty", () => {
    expect(undoHistory(createHistoryState())).toBeUndefined();
  });

  it("restores the previous snapshot and moves the latest entry to redo stack", () => {
    const olderEntry = createEntry("", "你");
    const latestEntry = createEntry("你", "你好");
    const redoEntry = createEntry("旧", "旧文");
    const history = createHistoryState([olderEntry, latestEntry], [redoEntry]);

    const change = undoHistory(history);

    expect(change?.document).toEqual(createSnapshot("你").document);
    expect(change?.selection).toEqual({
      anchor: { path: [0, 0], offset: 1 },
      focus: { path: [0, 0], offset: 1 },
    });
    expect(change?.entry).toEqual(latestEntry);
    expect(change?.entry).not.toBe(latestEntry);
    expect(change?.history.undoStack).toEqual([olderEntry]);
    expect(change?.history.undoStack.at(-1)).not.toBe(olderEntry);
    expect(change?.history.redoStack).toEqual([redoEntry, latestEntry]);
    expect(change?.history.redoStack.at(-1)).not.toBe(latestEntry);
  });
});

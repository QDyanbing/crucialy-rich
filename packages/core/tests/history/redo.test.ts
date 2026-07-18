import { describe, expect, it } from "vitest";

import {
  createDocument,
  createHistorySnapshot,
  createHistoryState,
  createInsertTextOperation,
  createParagraph,
  createText,
  createTransaction,
  redoHistory,
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

describe("redoHistory", () => {
  it("returns undefined when redo stack is empty", () => {
    expect(redoHistory(createHistoryState())).toBeUndefined();
  });

  it("restores the next snapshot and moves the latest entry to undo stack", () => {
    const undoEntry = createEntry("", "你");
    const olderRedoEntry = createEntry("旧", "旧文");
    const latestRedoEntry = createEntry("你", "你好");
    const history = createHistoryState([undoEntry], [olderRedoEntry, latestRedoEntry]);

    const change = redoHistory(history);

    expect(change?.document).toEqual(createSnapshot("你好").document);
    expect(change?.selection).toEqual({
      anchor: { path: [0, 0], offset: 2 },
      focus: { path: [0, 0], offset: 2 },
    });
    expect(change?.entry).toEqual(latestRedoEntry);
    expect(change?.entry).not.toBe(latestRedoEntry);
    expect(change?.history.redoStack).toEqual([olderRedoEntry]);
    expect(change?.history.redoStack.at(-1)).not.toBe(olderRedoEntry);
    expect(change?.history.undoStack).toEqual([undoEntry, latestRedoEntry]);
    expect(change?.history.undoStack.at(-1)).not.toBe(latestRedoEntry);
  });
});

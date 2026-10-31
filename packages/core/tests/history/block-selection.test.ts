import { describe, expect, it } from "vitest";
import {
  applyTransaction,
  createBlockSelection,
  createDocument,
  createHistorySnapshot,
  createHistoryState,
  createImage,
  createInsertBlockOperation,
  createTransaction,
  isImageBlockSelection,
  recordHistory,
  redoHistory,
  undoHistory,
} from "../../src";

function historyWithSelectedImages() {
  const document = createDocument([createImage("https://example.com/first.png")]);
  const transaction = createTransaction([
    createInsertBlockOperation([1], createImage("https://example.com/second.png")),
  ]);
  const after = applyTransaction(document, transaction);
  return recordHistory({
    history: createHistoryState(),
    transaction,
    before: createHistorySnapshot(document, undefined, createBlockSelection([0])),
    after: createHistorySnapshot(after, undefined, createBlockSelection([1])),
  });
}

describe("History block selection changes", () => {
  it.each(["undo", "redo"] as const)(
    "returns a detached block selection on %s",
    (action) => {
      const original = historyWithSelectedImages();
      const history = action === "undo" ? original : undoHistory(original)!.history;
      const frozen = structuredClone(history);
      const change = (action === "undo" ? undoHistory(history) : redoHistory(history))!;
      expect(change.blockSelection).toEqual(
        createBlockSelection([action === "undo" ? 0 : 1]),
      );
      expect(change).not.toHaveProperty("selection");
      expect(isImageBlockSelection(change.document, change.blockSelection!)).toBe(true);
      change.blockSelection!.path[0] = 9;
      expect(history).toEqual(frozen);
      const entry = action === "undo" ? change.entry.before : change.entry.after;
      expect(entry.blockSelection!.path[0]).toBe(action === "undo" ? 0 : 1);
    },
  );

  it("keeps block selections through repeated undo redo cycles", () => {
    const history = historyWithSelectedImages();
    let current = history;
    for (let index = 0; index < 3; index++) {
      const undone = undoHistory(current)!;
      expect(undone.blockSelection).toEqual(createBlockSelection([0]));
      const redone = redoHistory(undone.history)!;
      expect(redone.blockSelection).toEqual(createBlockSelection([1]));
      current = redone.history;
    }
    expect(current).toEqual(history);
  });
});

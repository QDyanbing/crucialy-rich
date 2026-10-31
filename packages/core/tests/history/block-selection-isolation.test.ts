import { describe, expect, it } from "vitest";
import {
  applyTransaction,
  cloneHistoryEntry,
  createBlockSelection,
  createDocument,
  createHistorySnapshot,
  createHistoryState,
  createImage,
  createInsertBlockOperation,
  createTransaction,
  mergeHistoryEntries,
  recordHistory,
} from "../../src";

function entryInput() {
  const document = createDocument([createImage("https://example.com/a.png")]);
  const transaction = createTransaction([
    createInsertBlockOperation([1], createImage("https://example.com/b.png")),
  ]);
  return {
    before: createHistorySnapshot(document, undefined, createBlockSelection([0])),
    after: createHistorySnapshot(
      applyTransaction(document, transaction),
      undefined,
      createBlockSelection([1]),
    ),
    transaction,
    batch: "typing",
  };
}

describe("History block selection isolation", () => {
  it("detaches recorded and cloned entry paths from their inputs", () => {
    const input = entryInput();
    const history = recordHistory({ ...input, history: createHistoryState() });
    const recorded = history.undoStack[0]!;
    const clone = cloneHistoryEntry(recorded);
    input.before.blockSelection!.path[0] = 9;
    input.after.blockSelection!.path[0] = 8;
    clone.before.blockSelection!.path[0] = 7;
    clone.after.blockSelection!.path[0] = 6;
    expect(recorded.before.blockSelection).toEqual(createBlockSelection([0]));
    expect(recorded.after.blockSelection).toEqual(createBlockSelection([1]));
  });

  it("preserves detached outer selections in the explicit low-level merge helper", () => {
    const previous = entryInput();
    const next = entryInput();
    next.after.blockSelection = createBlockSelection([0]);
    const merged = mergeHistoryEntries(previous, next);
    expect(merged.before.blockSelection).toEqual(createBlockSelection([0]));
    expect(merged.after.blockSelection).toEqual(createBlockSelection([0]));
    previous.before.blockSelection!.path[0] = 8;
    next.after.blockSelection!.path[0] = 9;
    expect(merged.before.blockSelection).toEqual(createBlockSelection([0]));
    expect(merged.after.blockSelection).toEqual(createBlockSelection([0]));
  });

  it.each(["batch", "adjacent"] as const)(
    "keeps block entries separate under recordHistory %s",
    (mergePolicy) => {
      const input = entryInput();
      const first = recordHistory({
        ...input,
        history: createHistoryState(),
        mergePolicy,
      });
      const next = recordHistory({ ...input, history: first, mergePolicy });
      expect(next.undoStack).toHaveLength(2);
      expect(next.undoStack.map((entry) => entry.before.blockSelection)).toEqual([
        createBlockSelection([0]),
        createBlockSelection([0]),
      ]);
    },
  );

  it("does not record a standalone selection change with an empty transaction", () => {
    const input = entryInput();
    const history = recordHistory({ ...input, history: createHistoryState() });
    const next = recordHistory({ ...input, history, transaction: createTransaction() });
    expect(next).toEqual(history);
    expect(next.undoStack).toHaveLength(1);
  });
});

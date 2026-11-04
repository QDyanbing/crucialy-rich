import { describe, expect, it } from "vitest";
import {
  createDocument,
  createHistorySnapshot,
  createHistoryState,
  createInsertTextOperation,
  createParagraph,
  createText,
  createTransaction,
  recordHistory,
  type HistoryEntry,
} from "../../src";

function entry(text: string, batch?: string): HistoryEntry {
  const snapshot = createHistorySnapshot(
    createDocument([createParagraph([createText(text)])]),
    {
      anchor: { path: [0, 0], offset: 1 },
      focus: { path: [0, 0], offset: 1 },
    },
  );
  return {
    before: snapshot,
    after: snapshot,
    ...(batch ? { batch } : {}),
    transaction: createTransaction([
      createInsertTextOperation({ path: [0, 0], offset: 0 }, text),
    ]),
  };
}

describe("recorded history ownership", () => {
  it.each(["batch", "adjacent"] as const)(
    "isolates retained entries when appending with %s policy",
    (mergePolicy) => {
      const previous = createHistoryState([entry("旧", "older")]);
      const next = recordHistory({
        history: previous,
        mergePolicy,
        ...entry("新", "typing"),
      });
      const expected = structuredClone(next);
      previous.undoStack[0]!.before.selection!.anchor.path[0] = 99;
      previous.undoStack[0]!.transaction.operations.length = 0;
      expect(next).toEqual(expected);
      next.undoStack[0]!.after.selection!.focus.offset = 99;
      expect(previous.undoStack[0]!.after.selection!.focus.offset).toBe(1);
      expect(next.undoStack).toHaveLength(2);
    },
  );

  it.each(["batch", "adjacent"] as const)(
    "isolates the untouched prefix when merging with %s policy",
    (mergePolicy) => {
      const previous = createHistoryState([
        entry("前", "older"),
        entry("中", "typing"),
      ]);
      const next = recordHistory({
        history: previous,
        mergePolicy,
        ...entry("后", "typing"),
      });
      expect(next.undoStack).toHaveLength(2);
      expect(next.undoStack[1]!.transaction.operations).toHaveLength(2);
      const expected = structuredClone(next);
      previous.undoStack[0]!.before.document.children.length = 0;
      previous.undoStack[1]!.after.selection!.anchor.offset = 99;
      expect(next).toEqual(expected);
      next.undoStack[0]!.transaction.operations.length = 0;
      expect(previous.undoStack[0]!.transaction.operations).toHaveLength(1);
    },
  );
});

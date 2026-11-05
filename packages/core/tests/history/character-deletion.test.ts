import { describe, expect, it } from "vitest";
import {
  applyTransaction,
  createBackspaceInputTransaction,
  createDeleteInputTransaction,
  createSelectionAfterBackspaceInput,
  createSelectionAfterDeleteInput,
  createDocument,
  createHistorySnapshot,
  createHistoryState,
  createParagraph,
  createText,
  insertTextCommand,
  recordHistory,
  redoHistory,
  undoHistory,
  isValidPoint,
} from "../../src";

describe.each(["backward", "forward"] as const)("%s grapheme History", (direction) => {
  function deletion(cluster: string) {
    const document = createDocument([
      createParagraph([
        createText("A", { bold: true }),
        createText(cluster, { italic: true }),
        createText("B", { link: { href: "https://example.com/" } }),
      ]),
      createParagraph([createText("邻段")]),
    ]);
    const point = {
      path: [0, 1],
      offset: direction === "backward" ? cluster.length : 0,
    };
    const selection = { anchor: point, focus: point };
    const input = { document, selection };
    const transaction =
      direction === "backward"
        ? createBackspaceInputTransaction(input)
        : createDeleteInputTransaction(input);
    const nextSelection =
      direction === "backward"
        ? createSelectionAfterBackspaceInput(input)
        : createSelectionAfterDeleteInput(input);
    const after = applyTransaction(document, transaction);
    const history = recordHistory({
      history: createHistoryState(),
      before: createHistorySnapshot(document, selection),
      after: createHistorySnapshot(after, nextSelection),
      transaction,
    });
    return { document, selection, after, nextSelection, history };
  }

  it.each(["\u{1f600}", "e\u0301", "\u{1f469}\u200d\u{1f4bb}", "\u{1f1e8}\u{1f1f3}"])(
    "restores exact text, marks and UTF-16 caret in one undo: %s",
    (cluster) => {
      const state = deletion(cluster);
      expect(state.history.undoStack).toHaveLength(1);
      expect(state.history.undoStack[0]!.transaction.operations).toHaveLength(1);
      const undone = undoHistory(state.history)!;
      expect(undone.document).toEqual(state.document);
      expect(undone.selection).toEqual(state.selection);
      const redone = redoHistory(undone.history)!;
      expect(redone.document).toEqual(state.after);
      expect(redone.selection).toEqual(state.nextSelection);
      expect(isValidPoint(redone.document, redone.selection!.anchor)).toBe(true);
    },
  );

  it("keeps subsequent input independently undoable", () => {
    const state = deletion("\u{1f469}\u200d\u{1f4bb}");
    const typed = insertTextCommand.execute({
      context: { document: state.after, selection: state.nextSelection },
      payload: { text: "新" },
    });
    const after = applyTransaction(state.after, typed.transaction!);
    const history = recordHistory({
      history: state.history,
      batch: "typing",
      mergePolicy: "adjacent",
      before: createHistorySnapshot(state.after, state.nextSelection),
      after: createHistorySnapshot(after, typed.selection),
      transaction: typed.transaction!,
    });
    expect(history.undoStack).toHaveLength(2);
    const undoTyping = undoHistory(history)!;
    expect(undoTyping.document).toEqual(state.after);
    expect(undoHistory(undoTyping.history)!.document).toEqual(state.document);
    const redoTyping = redoHistory(undoTyping.history)!;
    expect(redoTyping.document).toEqual(after);
    expect(isValidPoint(after, redoTyping.selection!.anchor)).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import {
  applyTransaction,
  createDocument,
  createHistorySnapshot,
  createHistoryState,
  createParagraph,
  createTable,
  createText,
  createTransaction,
  getAdjacentCellSelection,
  insertTextCommand,
  recordHistory,
  redoHistory,
  undoHistory,
  type DocumentNode,
  type HistoryMergePolicy,
  type HistoryState,
  type RangeSelection,
} from "../../src";

function caret(path = [0, 0], offset = 1): RangeSelection {
  return { anchor: { path, offset }, focus: { path: [...path], offset } };
}

function recordText(
  document: DocumentNode,
  selection: RangeSelection,
  history: HistoryState,
  text: string,
  mergePolicy: HistoryMergePolicy = "adjacent",
) {
  const result = insertTextCommand.execute({
    context: { document, selection },
    payload: { text },
  });
  if (!result.transaction || !result.selection)
    throw new Error("Missing text input result.");
  const after = applyTransaction(document, result.transaction);
  return {
    document: after,
    selection: result.selection,
    history: recordHistory({
      history,
      transaction: result.transaction,
      batch: "typing",
      mergePolicy,
      before: createHistorySnapshot(document, selection),
      after: createHistorySnapshot(after, result.selection),
    }),
  };
}

describe("recordHistory adjacent policy", () => {
  it("starts a separate entry when typing after undo leaves a redo branch", () => {
    const document = createDocument([
      createParagraph([createText("前后")]),
      createParagraph([createText("其他")]),
    ]);
    const first = recordText(document, caret(), createHistoryState(), "甲");
    const second = recordText(first.document, caret([1, 0], 0), first.history, "乙");
    const undone = undoHistory(second.history)!;
    const branch = recordText(undone.document, first.selection, undone.history, "新");
    expect(branch.history.undoStack).toHaveLength(2);
    expect(branch.history.redoStack).toHaveLength(0);
    expect(undoHistory(branch.history)?.document).toEqual(first.document);
    expect(second.history.redoStack).toHaveLength(0);
    expect(undone.history.redoStack).toHaveLength(1);
  });

  it("does not clear redo or add a boundary for empty transactions", () => {
    const document = createDocument([createParagraph([createText("前后")])]);
    const first = recordText(document, caret(), createHistoryState(), "甲");
    const undone = undoHistory(first.history)!;
    const history = recordHistory({
      history: undone.history,
      batch: "typing",
      mergePolicy: "adjacent",
      transaction: createTransaction(),
      before: createHistorySnapshot(undone.document, caret()),
      after: createHistorySnapshot(undone.document, caret()),
    });
    expect(history).toEqual(undone.history);
    expect(history.redoStack).toHaveLength(1);
  });

  it("merges truly contiguous typing and restores the whole run", () => {
    const document = createDocument([createParagraph([createText("前后")])]);
    const first = recordText(document, caret(), createHistoryState(), "甲");
    const second = recordText(first.document, first.selection, first.history, "乙");
    expect(second.history.undoStack).toHaveLength(1);
    expect(second.document).toEqual(
      createDocument([createParagraph([createText("前甲乙后")])]),
    );
    const undone = undoHistory(second.history)!;
    expect(undone.document).toEqual(document);
    expect(undone.selection).toEqual(caret());
    expect(redoHistory(undone.history)?.document).toEqual(second.document);
  });

  it("separates typing after a same-paragraph caret jump", () => {
    const document = createDocument([createParagraph([createText("前后")])]);
    const first = recordText(document, caret(), createHistoryState(), "甲");
    const moved = caret([0, 0], 0);
    const second = recordText(first.document, moved, first.history, "乙");
    expect(second.history.undoStack).toHaveLength(2);
    const undone = undoHistory(second.history)!;
    expect(undone.document).toEqual(first.document);
    expect(undone.selection).toEqual(moved);
    expect(undoHistory(undone.history)?.document).toEqual(document);
    expect(redoHistory(undone.history)?.document).toEqual(second.document);
  });

  it("keeps typing in different table cells independently undoable after Tab navigation", () => {
    const document = createDocument([createTable(1, 2)]);
    const first = recordText(
      document,
      caret([0, 0, 0, 0, 0], 0),
      createHistoryState(),
      "甲",
    );
    const moved = getAdjacentCellSelection(first.document, first.selection)!;
    const second = recordText(first.document, moved, first.history, "乙");
    expect(second.history.undoStack).toHaveLength(2);
    const undone = undoHistory(second.history)!;
    expect(undone.document).toEqual(first.document);
    expect(undone.selection).toEqual(moved);
    expect(redoHistory(undone.history)?.selection).toEqual(second.selection);
  });

  it("keeps explicit batch policy compatible across caret jumps", () => {
    const document = createDocument([createParagraph([createText("前后")])]);
    const first = recordText(document, caret(), createHistoryState(), "甲", "batch");
    const second = recordText(
      first.document,
      caret([0, 0], 0),
      first.history,
      "乙",
      "batch",
    );
    expect(second.history.undoStack).toHaveLength(1);
  });
});

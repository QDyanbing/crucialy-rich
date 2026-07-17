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
} from "../../src";

function createSnapshot(text: string) {
  return createHistorySnapshot(createDocument([createParagraph([createText(text)])]), {
    anchor: { path: [0, 0], offset: text.length },
    focus: { path: [0, 0], offset: text.length },
  });
}

describe("recordHistory", () => {
  it("pushes non-empty transactions onto undo stack and clears redo stack", () => {
    const transaction = createTransaction([
      createInsertTextOperation({ path: [0, 0], offset: 2 }, "世界"),
    ]);
    const history = createHistoryState(
      [],
      [
        {
          after: createSnapshot("redo after"),
          before: createSnapshot("redo before"),
          transaction,
        },
      ],
    );

    const nextHistory = recordHistory({
      after: createSnapshot("你好世界"),
      batch: "typing",
      before: createSnapshot("你好"),
      history,
      transaction,
    });

    expect(nextHistory.redoStack).toEqual([]);
    expect(nextHistory.undoStack).toHaveLength(1);
    expect(nextHistory.undoStack[0]?.batch).toBe("typing");
    expect(nextHistory.undoStack[0]?.transaction).toEqual(transaction);
  });

  it("keeps history unchanged for empty transactions", () => {
    const history = createHistoryState([
      {
        after: createSnapshot("after"),
        before: createSnapshot("before"),
        transaction: createTransaction(),
      },
    ]);

    const nextHistory = recordHistory({
      after: createSnapshot("after"),
      before: createSnapshot("before"),
      history,
      transaction: createTransaction(),
    });

    expect(nextHistory).toEqual(history);
    expect(nextHistory).not.toBe(history);
  });

  it("clones recorded transaction operations", () => {
    const operation = createInsertTextOperation({ path: [0, 0], offset: 0 }, "新");
    const transaction = createTransaction([operation]);
    const history = recordHistory({
      after: createSnapshot("新"),
      before: createSnapshot(""),
      history: createHistoryState(),
      transaction,
    });

    operation.point.path[0] = 9;

    expect(history.undoStack[0]?.transaction.operations[0]).toEqual({
      point: { path: [0, 0], offset: 0 },
      text: "新",
      type: "insert_text",
    });
  });
});

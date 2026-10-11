import { describe, expect, it } from "vitest";

import {
  applyTransaction,
  clearFormattingCommand,
  createDocument,
  createHistorySnapshot,
  createHistoryState,
  createParagraph,
  createTableCell,
  createTableRow,
  createText,
  recordHistory,
  redoHistory,
  undoHistory,
} from "../../src";

describe("table paragraph formatting history", () => {
  it("undoes and redoes one multi-paragraph clear transaction", () => {
    const document = createDocument([
      {
        children: [
          createTableRow([
            createTableCell([
              createParagraph([createText("第一段", { bold: true })]),
              createParagraph([
                createText("第二段", {
                  link: { href: "https://example.com/cell" },
                  textColor: "#1677ff",
                }),
              ]),
            ]),
          ]),
        ],
        type: "table",
      },
    ]);
    const selection = {
      anchor: { path: [0, 0, 0, 0, 0], offset: 0 },
      focus: { path: [0, 0, 0, 1, 0], offset: 3 },
    };
    const result = clearFormattingCommand.execute({
      context: { document, selection },
    });

    if (!result.transaction || !result.selection) {
      throw new Error("Clear formatting should update both table paragraphs.");
    }

    const clearedDocument = applyTransaction(document, result.transaction);
    const history = recordHistory({
      after: createHistorySnapshot(clearedDocument, result.selection),
      before: createHistorySnapshot(document, selection),
      history: createHistoryState(),
      transaction: result.transaction,
    });
    const undone = undoHistory(history);
    const redone = undone ? redoHistory(undone.history) : undefined;

    expect(history.undoStack[0]?.transaction.operations).toHaveLength(2);
    expect(undone?.document).toEqual(document);
    expect(undone?.selection).toEqual(selection);
    expect(redone?.document).toEqual(clearedDocument);
    expect(redone?.selection).toEqual(result.selection);
  });
});

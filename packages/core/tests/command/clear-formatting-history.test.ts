import { describe, expect, it } from "vitest";

import {
  applyTransaction,
  CLEAR_FORMATTING_COMMAND_NAME,
  createDefaultCommandRegistry,
  createDocument,
  createHistorySnapshot,
  createHistoryState,
  createParagraph,
  createText,
  executeCommand,
  recordHistory,
  redoHistory,
  undoHistory,
} from "../../src";

describe("clear formatting command history", () => {
  it("undoes and redoes one clear formatting transaction", () => {
    const document = createDocument([
      createParagraph([
        createText("富文本", {
          bold: true,
          fontSize: 20,
          link: { href: "https://example.com/" },
          textColor: "#1677ff",
        }),
      ]),
    ]);
    const selection = {
      anchor: { path: [0, 0], offset: 0 },
      focus: { path: [0, 0], offset: 3 },
    };
    const result = executeCommand(
      createDefaultCommandRegistry(),
      CLEAR_FORMATTING_COMMAND_NAME,
      { context: { document, selection } },
    );

    if (!result.transaction || !result.selection) {
      throw new Error(
        "Clear formatting command should return a transaction and selection.",
      );
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

    expect(history.undoStack).toHaveLength(1);
    expect(history.undoStack[0]?.transaction.operations).toHaveLength(1);
    expect(undone?.document).toEqual(document);
    expect(undone?.selection).toEqual(selection);
    expect(redone?.document).toEqual(clearedDocument);
    expect(redone?.selection).toEqual(result.selection);
    expect(clearedDocument.children[0]?.children).toEqual([
      { text: "富文本", type: "text" },
    ]);
  });
});

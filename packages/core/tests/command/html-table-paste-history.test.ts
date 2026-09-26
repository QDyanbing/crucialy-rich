import { describe, expect, it } from "vitest";

import {
  applyTransaction,
  createDocument,
  createHistorySnapshot,
  createHistoryState,
  createParagraph,
  createText,
  isTableNode,
  parseHtml,
  pasteCommand,
  recordHistory,
  redoHistory,
  undoHistory,
} from "../../src";

describe("HTML table paste history", () => {
  it("undoes and redoes a pasted table as one history entry", () => {
    const document = createDocument([createParagraph([createText("前后")])]);
    const selection = {
      anchor: { offset: 1, path: [0, 0] },
      focus: { offset: 1, path: [0, 0] },
    };
    const result = pasteCommand.execute({
      context: { document, selection },
      payload: {
        fragment: parseHtml(
          "<table><tr><td>姓名</td><td>角色</td></tr><tr><td>小明</td><td>开发</td></tr></table>",
        )!,
      },
    });

    if (!result.transaction || !result.selection) {
      throw new Error("HTML table paste should return a transaction and selection.");
    }

    const pastedDocument = applyTransaction(document, result.transaction);
    const history = recordHistory({
      after: createHistorySnapshot(pastedDocument, result.selection),
      before: createHistorySnapshot(document, selection),
      history: createHistoryState(),
      transaction: result.transaction,
    });
    const undone = undoHistory(history);
    const redone = undone ? redoHistory(undone.history) : undefined;
    const table = redone?.document.children[1];

    expect(history.undoStack).toHaveLength(1);
    expect(undone?.document).toEqual(document);
    expect(undone?.selection).toEqual(selection);
    expect(redone?.document).toEqual(pastedDocument);
    expect(redone?.selection).toEqual(result.selection);
    expect(isTableNode(table)).toBe(true);

    if (!isTableNode(table)) {
      throw new Error("expected table result");
    }

    expect(
      table.children.map((row) =>
        row.children.map((cell) => cell.children[0]?.children[0]?.text),
      ),
    ).toEqual([
      ["姓名", "角色"],
      ["小明", "开发"],
    ]);
  });
});

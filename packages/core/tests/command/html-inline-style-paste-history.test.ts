import { describe, expect, it } from "vitest";

import {
  applyTransaction,
  createDocument,
  createHistorySnapshot,
  createHistoryState,
  createParagraph,
  createText,
  parseHtml,
  pasteCommand,
  recordHistory,
  redoHistory,
  undoHistory,
} from "../../src";

describe("HTML inline style paste history", () => {
  it("undoes and redoes pasted inline styles as one history entry", () => {
    const document = createDocument([createParagraph([createText("前后")])]);
    const selection = {
      anchor: { offset: 1, path: [0, 0] },
      focus: { offset: 1, path: [0, 0] },
    };
    const result = pasteCommand.execute({
      context: { document, selection },
      payload: {
        fragment: parseHtml(
          '<p><span style="font-size: 18px; color: #369; background-color: #ffc">样式文本</span></p>',
        )!,
      },
    });

    if (!result.transaction || !result.selection) {
      throw new Error(
        "HTML inline style paste should return a transaction and selection.",
      );
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

    expect(history.undoStack).toHaveLength(1);
    expect(undone?.document).toEqual(document);
    expect(undone?.selection).toEqual(selection);
    expect(redone?.document).toEqual(pastedDocument);
    expect(redone?.selection).toEqual(result.selection);
    expect(redone?.document.children[1]).toMatchObject({
      children: [
        {
          marks: {
            backgroundColor: "#ffffcc",
            fontSize: 18,
            textColor: "#336699",
          },
          text: "样式文本",
        },
      ],
    });
  });
});

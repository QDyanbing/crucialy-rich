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

describe("HTML link metadata paste history", () => {
  it("undoes and redoes pasted link metadata as one history entry", () => {
    const document = createDocument([createParagraph([createText("前后")])]);
    const selection = {
      anchor: { offset: 1, path: [0, 0] },
      focus: { offset: 1, path: [0, 0] },
    };
    const result = pasteCommand.execute({
      context: { document, selection },
      payload: {
        fragment: parseHtml(
          '<p><a href="https://example.com/docs" target="_blank" rel="noopener noreferrer">链接文档</a></p>',
        )!,
      },
    });

    if (!result.transaction || !result.selection) {
      throw new Error(
        "HTML link metadata paste should return a transaction and selection.",
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
            link: {
              href: "https://example.com/docs",
              rel: "noopener noreferrer",
              target: "_blank",
            },
          },
          text: "链接文档",
        },
      ],
    });
  });
});

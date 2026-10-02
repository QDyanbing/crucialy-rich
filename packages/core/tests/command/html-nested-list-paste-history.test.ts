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

describe("HTML nested list paste history", () => {
  it("undoes and redoes a nested list as one history entry", () => {
    const document = createDocument([createParagraph([createText("前后")])]);
    const selection = {
      anchor: { offset: 1, path: [0, 0] },
      focus: { offset: 1, path: [0, 0] },
    };
    const result = pasteCommand.execute({
      context: { document, selection },
      payload: {
        fragment: parseHtml("<ul><li>父项<ol><li>子项</li></ol></li></ul>")!,
      },
    });

    if (!result.transaction || !result.selection) {
      throw new Error("Nested list paste should return a transaction and selection.");
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
    expect(redone?.selection).toEqual({
      anchor: { offset: 2, path: [1, 0, 1, 0, 0] },
      focus: { offset: 2, path: [1, 0, 1, 0, 0] },
    });
    expect(redone?.document.children[1]).toMatchObject({
      children: [
        {
          nested: {
            children: [{ children: [{ text: "子项" }] }],
            type: "orderedList",
          },
        },
      ],
      type: "bulletList",
    });
  });
});

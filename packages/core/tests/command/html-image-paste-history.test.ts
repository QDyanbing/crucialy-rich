import { describe, expect, it } from "vitest";

import {
  applyTransaction,
  createDocument,
  createHistorySnapshot,
  createHistoryState,
  createParagraph,
  createText,
  isImageNode,
  parseHtml,
  pasteCommand,
  recordHistory,
  redoHistory,
  undoHistory,
} from "../../src";

describe("HTML image paste history", () => {
  it("undoes and redoes a pasted image as one history entry", () => {
    const document = createDocument([createParagraph([createText("前后")])]);
    const selection = {
      anchor: { offset: 1, path: [0, 0] },
      focus: { offset: 1, path: [0, 0] },
    };
    const result = pasteCommand.execute({
      context: { document, selection },
      payload: {
        fragment: parseHtml('<img src="https://example.com/cover.png" alt="封面">')!,
      },
    });

    if (!result.transaction || !result.selection) {
      throw new Error("HTML image paste should return a transaction and selection.");
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
    const image = redone?.document.children[1];

    expect(history.undoStack).toHaveLength(1);
    expect(undone?.document).toEqual(document);
    expect(undone?.selection).toEqual(selection);
    expect(redone?.document).toEqual(pastedDocument);
    expect(redone?.selection).toEqual(result.selection);
    expect(isImageNode(image)).toBe(true);
    expect(image).toMatchObject({
      alt: "封面",
      src: "https://example.com/cover.png",
    });
  });
});

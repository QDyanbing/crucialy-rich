import { describe, expect, it } from "vitest";
import {
  applyTransaction,
  createDocument,
  createParagraph,
  createText,
  createMarkdownInputRuleResult,
  createHistoryState,
  createHistorySnapshot,
  recordHistory,
  undoHistory,
  redoHistory,
} from "../../src";
describe("input rule suffix History", () => {
  it.each(["#", ">", "-", "1.", "``"])("restores %s with its full suffix", (prefix) => {
    const document = createDocument([
      createParagraph([createText(prefix + "保留😀正文")]),
    ]);
    const point = { path: [0, 0], offset: prefix.length };
    const selection = { anchor: point, focus: point };
    const result = createMarkdownInputRuleResult({
      document,
      selection,
      data: prefix === "``" ? "`" : " ",
    })!;
    const after = applyTransaction(document, result.transaction);
    const history = recordHistory({
      history: createHistoryState(),
      transaction: result.transaction,
      before: createHistorySnapshot(document, selection),
      after: createHistorySnapshot(after, result.selection),
    });
    expect(history.undoStack).toHaveLength(1);
    const undo = undoHistory(history)!;
    expect(undo.document).toEqual(document);
    expect(undo.selection).toEqual(selection);
    const redo = redoHistory(undo.history)!;
    expect(redo.document).toEqual(after);
    expect(redo.selection).toEqual(result.selection);
  });
});

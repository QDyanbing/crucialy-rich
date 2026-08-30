import { describe, expect, it } from "vitest";

import {
  applyTransaction,
  createDefaultCommandRegistry,
  createDocument,
  createHeading,
  createHistorySnapshot,
  createHistoryState,
  createParagraph,
  createQuote,
  createText,
  executeCommand,
  recordHistory,
  redoHistory,
  SET_HEADING_COMMAND_NAME,
  TOGGLE_QUOTE_COMMAND_NAME,
  undoHistory,
} from "../../src";

describe("block type command history", () => {
  it("undoes and redoes consecutive heading and quote changes", () => {
    const registry = createDefaultCommandRegistry();
    const document = createDocument([
      createParagraph([createText("正文", { bold: true })]),
      createHeading(2, [createText("标题", { italic: true })]),
      createQuote([createText("引用", { underline: true })]),
    ]);
    const selection = {
      anchor: { path: [0, 0], offset: 0 },
      focus: { path: [2, 0], offset: 1 },
    };
    const headingResult = executeCommand(registry, SET_HEADING_COMMAND_NAME, {
      context: { document, selection },
      payload: { level: 3 },
    });

    if (!headingResult.transaction || !headingResult.selection) {
      throw new Error("Set heading command should return a transaction and selection.");
    }

    const headingDocument = applyTransaction(document, headingResult.transaction);
    const headingHistory = recordHistory({
      after: createHistorySnapshot(headingDocument, headingResult.selection),
      before: createHistorySnapshot(document, selection),
      history: createHistoryState(),
      transaction: headingResult.transaction,
    });
    const quoteResult = executeCommand(registry, TOGGLE_QUOTE_COMMAND_NAME, {
      context: { document: headingDocument, selection: headingResult.selection },
    });

    if (!quoteResult.transaction || !quoteResult.selection) {
      throw new Error(
        "Toggle quote command should return a transaction and selection.",
      );
    }

    const quoteDocument = applyTransaction(headingDocument, quoteResult.transaction);
    const history = recordHistory({
      after: createHistorySnapshot(quoteDocument, quoteResult.selection),
      before: createHistorySnapshot(headingDocument, headingResult.selection),
      history: headingHistory,
      transaction: quoteResult.transaction,
    });
    const undoneQuote = undoHistory(history);
    const undoneHeading = undoneQuote ? undoHistory(undoneQuote.history) : undefined;
    const redoneHeading = undoneHeading
      ? redoHistory(undoneHeading.history)
      : undefined;
    const redoneQuote = redoneHeading ? redoHistory(redoneHeading.history) : undefined;

    expect(undoneQuote?.document).toEqual(headingDocument);
    expect(undoneHeading?.document).toEqual(document);
    expect(redoneHeading?.document).toEqual(headingDocument);
    expect(redoneQuote?.document).toEqual(quoteDocument);
    expect(redoneQuote?.selection).toEqual(selection);
    expect(quoteDocument.children.map((block) => block.type)).toEqual([
      "quote",
      "quote",
      "quote",
    ]);
    expect(quoteDocument.children.map((block) => block.children[0]?.marks)).toEqual([
      { bold: true },
      { italic: true },
      { underline: true },
    ]);
  });
});

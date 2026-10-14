import { describe, expect, it } from "vitest";

import {
  applyTransaction,
  createDocument,
  createHistorySnapshot,
  createHistoryState,
  createParagraph,
  createTableCell,
  createTableRow,
  createText,
  parseHtml,
  parseMarkdown,
  parsePlainText,
  pasteCommand,
  recordHistory,
  redoHistory,
  undoHistory,
  type ClipboardFragment,
  type DocumentNode,
  type RangeSelection,
} from "../../src";

function verifyPasteHistory(
  document: DocumentNode,
  selection: RangeSelection,
  fragment: ClipboardFragment,
) {
  const result = pasteCommand.execute({
    context: { document, selection },
    payload: { fragment },
  });
  if (!result.transaction || !result.selection) {
    throw new Error("Range paste must return a transaction and caret.");
  }
  const after = applyTransaction(document, result.transaction);
  const history = recordHistory({
    after: createHistorySnapshot(after, result.selection),
    before: createHistorySnapshot(document, selection),
    history: createHistoryState(),
    transaction: result.transaction,
  });
  const undone = undoHistory(history)!;
  const redone = redoHistory(undone.history)!;

  expect(result.transaction.operations[0]?.type).toBe("delete_range");
  expect(history.undoStack).toHaveLength(1);
  expect(undone.document).toEqual(document);
  expect(undone.selection).toEqual(selection);
  expect(undone.history.undoStack).toHaveLength(0);
  expect(redone.document).toEqual(after);
  expect(redone.selection).toEqual(result.selection);
  expect(redone.history.redoStack).toHaveLength(0);
  expect(redone.history.undoStack).toHaveLength(1);

  const changed = pasteCommand.execute({
    context: { document: undone.document, selection },
    payload: { fragment: parsePlainText("另一份")! },
  });
  const nextHistory = recordHistory({
    after: createHistorySnapshot(
      applyTransaction(undone.document, changed.transaction!),
      changed.selection,
    ),
    before: createHistorySnapshot(undone.document, selection),
    history: undone.history,
    transaction: changed.transaction!,
  });
  expect(nextHistory.redoStack).toHaveLength(0);
  expect(undoHistory(nextHistory)?.document).toEqual(document);
  expect(undoHistory(nextHistory)?.selection).toEqual(selection);
}

describe("range paste history", () => {
  it.each([
    parsePlainText("第一行\n第二行")!,
    parseHtml('<p><strong>新</strong><a href="https://example.com">链接</a></p><hr>')!,
    parseMarkdown("# 新标题\n\n正文")!,
  ])("restores top-level $mimeType replacement and backward selection", (fragment) => {
    verifyPasteHistory(
      createDocument([
        createParagraph([createText("开头", { bold: true })]),
        createParagraph([createText("结尾", { italic: true })]),
      ]),
      {
        anchor: { path: [1, 0], offset: 1 },
        focus: { path: [0, 0], offset: 1 },
      },
      fragment,
    );
  });

  it.each(["第一行\n第二行", "甲\t乙\n丙\t丁"])(
    "restores cell paragraphs and retained boundary marks for %j",
    (text) => {
      const cell = (value: string) =>
        createTableCell([createParagraph([createText(value)])]);
      verifyPasteHistory(
        createDocument([
          createParagraph([createText("表格前方")]),
          {
            type: "table",
            children: [
              createTableRow([cell("表头一"), cell("表头二")]),
              createTableRow([
                cell("邻格"),
                createTableCell([
                  createParagraph([createText("开头", { bold: true })]),
                  createParagraph([createText("结尾", { italic: true })]),
                ]),
              ]),
            ],
          },
        ]),
        {
          anchor: { path: [1, 1, 1, 1, 0], offset: 1 },
          focus: { path: [1, 1, 1, 0, 0], offset: 1 },
        },
        parsePlainText(text)!,
      );
    },
  );
});

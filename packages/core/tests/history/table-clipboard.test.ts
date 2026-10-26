import { describe, expect, it } from "vitest";
import {
  applyTransaction,
  canExecutePasteCommand,
  createDocument,
  createHistorySnapshot,
  createHistoryState,
  createParagraph,
  createTable,
  createText,
  DEFAULT_CLIPBOARD_PARSERS,
  getClipboardHtml,
  getClipboardText,
  isTableNode,
  parseClipboardData,
  pasteCommand,
  recordHistory,
  redoHistory,
  undoHistory,
  validateDocument,
} from "../../src";

describe("structured table clipboard history", () => {
  for (const rows of [false, true]) {
    it.each([false, true])(
      `round trips a table fragment with completeRows=${rows}, backward=%s`,
      (backward) => {
        const table = createTable(2, 2);
        for (const row of table.children)
          for (const cell of row.children)
            cell.children = [createParagraph([createText("甲乙", { bold: true })])];
        const source = createDocument([table]);
        const original = structuredClone(source);
        const anchor = { path: [0, 0, 0, 0, 0], offset: rows ? 0 : 1 };
        const focus = { path: [0, rows ? 1 : 0, 1, 0, 0], offset: rows ? 2 : 1 };
        const range = backward ? { anchor: focus, focus: anchor } : { anchor, focus };
        const formats: Record<string, string> = {
          "text/plain": getClipboardText(source, range)!,
          "text/html": getClipboardHtml(source, range)!,
        };
        const document = createDocument([createParagraph([createText("正文")])]);
        const selection = {
          anchor: { path: [0, 0], offset: 0 },
          focus: { path: [0, 0], offset: 2 },
        };
        const context = { document, selection };
        const fragment = parseClipboardData(
          {
            types: Object.keys(formats),
            getData: (mime) => formats[mime] ?? "",
          },
          DEFAULT_CLIPBOARD_PARSERS,
          (candidate) =>
            canExecutePasteCommand({
              context,
              payload: { fragment: candidate },
            }),
        );
        expect(fragment?.mimeType).toBe("text/html");
        const result = pasteCommand.execute({ context, payload: { fragment } });
        expect(result.ok).toBe(true);
        const after = applyTransaction(document, result.transaction!);
        const pasted = after.children.find(isTableNode)!;
        expect(pasted.children).toHaveLength(rows ? 2 : 1);
        expect(
          pasted.children[0]!.children.map((cell) => cell.children[0]!.children),
        ).toEqual([
          [createText(rows ? "甲乙" : "乙", { bold: true })],
          [createText(rows ? "甲乙" : "甲", { bold: true })],
        ]);
        expect(validateDocument(after).valid).toBe(true);
        const history = recordHistory({
          history: createHistoryState(),
          transaction: result.transaction!,
          before: createHistorySnapshot(document, selection),
          after: createHistorySnapshot(after, result.selection),
        });
        expect(history.undoStack).toHaveLength(1);
        const undone = undoHistory(history)!;
        expect(undone.document).toEqual(document);
        expect(undone.selection).toEqual(selection);
        const redone = redoHistory(undone.history)!;
        expect(redone.document).toEqual(after);
        expect(redone.selection).toEqual(result.selection);
        expect(source).toEqual(original);
      },
    );
  }

  it("retains actual plain text fallback inside an existing cell", () => {
    const source = createDocument([createTable(1, 2)]);
    const range = {
      anchor: { path: [0, 0, 0, 0, 0], offset: 0 },
      focus: { path: [0, 0, 1, 0, 0], offset: 0 },
    };
    const formats: Record<string, string> = {
      "text/plain": getClipboardText(source, range)!,
      "text/html": getClipboardHtml(source, range)!,
    };
    const document = createDocument([createTable(1, 2)]);
    const point = { path: [0, 0, 0, 0, 0], offset: 0 };
    const context = { document, selection: { anchor: point, focus: point } };
    const fragment = parseClipboardData(
      {
        types: Object.keys(formats),
        getData: (mime) => formats[mime] ?? "",
      },
      DEFAULT_CLIPBOARD_PARSERS,
      (candidate) =>
        canExecutePasteCommand({ context, payload: { fragment: candidate } }),
    );
    expect(fragment?.mimeType).toBe("text/plain");
    const result = pasteCommand.execute({ context, payload: { fragment } });
    expect(result.ok).toBe(true);
    expect(
      validateDocument(applyTransaction(document, result.transaction!)).valid,
    ).toBe(true);
  });
});

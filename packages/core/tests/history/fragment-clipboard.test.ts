import { describe, expect, it } from "vitest";
import {
  applyTransaction,
  canExecutePasteCommand,
  createBulletList,
  createCodeBlock,
  createDivider,
  createDocument,
  createHistorySnapshot,
  createHistoryState,
  createListItem,
  createParagraph,
  createTable,
  createTaskItem,
  createTaskList,
  createText,
  DEFAULT_CLIPBOARD_PARSERS,
  getClipboardHtml,
  getClipboardText,
  parseClipboardData,
  parseHtml,
  pasteCommand,
  recordHistory,
  redoHistory,
  undoHistory,
  validateDocument,
} from "../../src";

const source = createDocument([
  createParagraph([createText("前甲", { bold: true })]),
  createTaskList([createTaskItem([createText("完成")], true)]),
  createDivider(),
  createTable(1, 1),
  createParagraph([createText("乙后", { italic: true })]),
]);
const anchor = { path: [0, 0], offset: 1 };
const focus = { path: [4, 0], offset: 1 };

describe("mixed clipboard paste history", () => {
  it.each([false, true])(
    "records one rich paste and restores snapshots (%s)",
    (backward) => {
      const original = structuredClone(source);
      const range = backward ? { anchor: focus, focus: anchor } : { anchor, focus };
      const formats: Record<string, string> = {
        "text/plain": getClipboardText(source, range)!,
        "text/html": getClipboardHtml(source, range)!,
      };
      const document = createDocument([
        createParagraph([createText("首原")]),
        createParagraph([createText("文尾")]),
      ]);
      const start = { path: [0, 0], offset: 1 };
      const end = { path: [1, 0], offset: 1 };
      const selection = backward
        ? { anchor: end, focus: start }
        : { anchor: start, focus: end };
      const context = { document, selection };
      const fragment = parseClipboardData(
        { types: Object.keys(formats), getData: (mime) => formats[mime] ?? "" },
        DEFAULT_CLIPBOARD_PARSERS,
        (candidate) =>
          canExecutePasteCommand({ context, payload: { fragment: candidate } }),
      );
      expect(fragment?.mimeType).toBe("text/html");
      const result = pasteCommand.execute({ context, payload: { fragment } });
      expect(result.ok).toBe(true);
      const after = applyTransaction(document, result.transaction!);
      expect(after.children.slice(1, 6)).toEqual(
        parseHtml(formats["text/html"]!)?.blocks,
      );
      expect(after.children[0]).toEqual(createParagraph([createText("首")]));
      expect(after.children.at(-1)).toEqual(createParagraph([createText("尾")]));
      expect(result.selection).toEqual({
        anchor: { path: [5, 0], offset: 1 },
        focus: { path: [5, 0], offset: 1 },
      });
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

  it.each([
    { block: createCodeBlock([createText("目标")]), path: [0, 0] },
    {
      block: createBulletList([createListItem([createText("目标")])]),
      path: [0, 0, 0],
    },
    { block: createTable(1, 1), path: [0, 0, 0, 0, 0] },
  ])(
    "uses actual plain text at a $block.type target, not inferred HTML text",
    ({ block, path }) => {
      const range = { anchor, focus };
      const formats: Record<string, string> = {
        "text/plain": getClipboardText(source, range)!,
        "text/html": getClipboardHtml(source, range)!,
      };
      const point = { path, offset: 0 };
      const context = {
        document: createDocument([block]),
        selection: { anchor: point, focus: point },
      };
      const accept = (candidate: NonNullable<ReturnType<typeof parseClipboardData>>) =>
        canExecutePasteCommand({ context, payload: { fragment: candidate } });
      const fragment = parseClipboardData(
        { types: Object.keys(formats), getData: (mime) => formats[mime] ?? "" },
        DEFAULT_CLIPBOARD_PARSERS,
        accept,
      );
      expect(fragment?.mimeType).toBe("text/plain");
      expect(pasteCommand.execute({ context, payload: { fragment } }).ok).toBe(true);
      expect(
        parseClipboardData(
          { types: ["text/html"], getData: () => formats["text/html"]! },
          DEFAULT_CLIPBOARD_PARSERS,
          accept,
        ),
      ).toBeUndefined();
    },
  );
});

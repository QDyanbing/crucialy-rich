import { describe, expect, it } from "vitest";
import {
  applyTransaction,
  canExecutePasteCommand,
  createBulletList,
  createCodeBlock,
  createDocument,
  createHistorySnapshot,
  createHistoryState,
  createImage,
  createListItem,
  createParagraph,
  createTable,
  createText,
  DEFAULT_CLIPBOARD_PARSERS,
  getClipboardHtml,
  getClipboardText,
  parseClipboardData,
  pasteCommand,
  recordHistory,
  redoHistory,
  undoHistory,
  validateDocument,
} from "../../src";

const source = createDocument([
  createParagraph([createText("前甲", { bold: true })]),
  createImage("https://example.com/a.png", { alt: "中文图片", width: 120, height: 80 }),
  createParagraph([createText("乙后", { italic: true })]),
]);
const anchor = { path: [0, 0], offset: 1 };
const focus = { path: [2, 0], offset: 1 };

describe("enclosed image clipboard paste history", () => {
  it.each([false, true])(
    "pastes the image reference as one undoable fragment (%s)",
    (backward) => {
      const original = structuredClone(source);
      const range = backward ? { anchor: focus, focus: anchor } : { anchor, focus };
      const formats: Record<string, string> = {
        "text/plain": getClipboardText(source, range)!,
        "text/html": getClipboardHtml(source, range)!,
      };
      const document = createDocument([createParagraph([createText("正文")])]);
      const start = { path: [0, 0], offset: 0 };
      const end = { path: [0, 0], offset: 2 };
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
      expect(after.children[2]).toEqual(source.children[1]);
      expect(after.children[2]).not.toBe(source.children[1]);
      expect(result.selection).toEqual({
        anchor: { path: [3, 0], offset: 1 },
        focus: { path: [3, 0], offset: 1 },
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
  ])("keeps actual plain fallback at a $block.type target", ({ block, path }) => {
    const formats: Record<string, string> = {
      "text/plain": getClipboardText(source, { anchor, focus })!,
      "text/html": getClipboardHtml(source, { anchor, focus })!,
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
    const result = pasteCommand.execute({ context, payload: { fragment } });
    expect(result.ok).toBe(true);
    const after = applyTransaction(context.document, result.transaction!);
    expect(after.children.some((node) => node.type === "image")).toBe(false);
    expect(validateDocument(after).valid).toBe(true);
    expect(
      parseClipboardData(
        { types: ["text/html"], getData: () => formats["text/html"]! },
        DEFAULT_CLIPBOARD_PARSERS,
        accept,
      ),
    ).toBeUndefined();
  });
});

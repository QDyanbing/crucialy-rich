import { describe, expect, it } from "vitest";
import {
  applyTransaction,
  canExecutePasteCommand,
  createBlockSelection,
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
  parseClipboardData,
  pasteCommand,
  recordHistory,
  redoHistory,
  undoHistory,
  validateDocument,
} from "../../src";

const image = createImage("https://example.com/a.png", {
  alt: "图片",
  width: 120,
  height: 80,
});
const source = createDocument([createParagraph([createText("未选")]), image]);
const formats: Record<string, string> = {
  "text/plain": "",
  "text/html": getClipboardHtml(source, createBlockSelection([1]))!,
};

describe("selected image clipboard paste history", () => {
  it.each([false, true])(
    "pastes only the image and restores the replaced text range (%s)",
    (backward) => {
      const original = structuredClone(source);
      const document = createDocument([createParagraph([createText("首原文尾")])]);
      const anchor = { path: [0, 0], offset: 1 };
      const focus = { path: [0, 0], offset: 3 };
      const selection = backward ? { anchor: focus, focus: anchor } : { anchor, focus };
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
      expect(after.children).toEqual([
        createParagraph([createText("首")]),
        image,
        createParagraph([createText("尾")]),
      ]);
      expect(result.selection).toEqual({
        anchor: { path: [2, 0], offset: 0 },
        focus: { path: [2, 0], offset: 0 },
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
  ])("does not invent plain text for a $block.type target", ({ block, path }) => {
    const document = createDocument([block]);
    const original = structuredClone(document);
    const point = { path, offset: 0 };
    const context = { document, selection: { anchor: point, focus: point } };
    const fragment = parseClipboardData(
      { types: Object.keys(formats), getData: (mime) => formats[mime] ?? "" },
      DEFAULT_CLIPBOARD_PARSERS,
      (candidate) =>
        canExecutePasteCommand({ context, payload: { fragment: candidate } }),
    );
    expect(fragment).toBeUndefined();
    expect(document).toEqual(original);
  });
});

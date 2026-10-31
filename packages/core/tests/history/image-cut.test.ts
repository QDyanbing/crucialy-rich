import { describe, expect, it } from "vitest";
import {
  applyTransaction,
  createBlockSelection,
  createDocument,
  createHistorySnapshot,
  createHistoryState,
  createImage,
  createParagraph,
  createText,
  deleteImageCommand,
  getClipboardHtml,
  isValidPoint,
  parseHtml,
  pasteCommand,
  recordHistory,
  redoHistory,
  undoHistory,
  validateDocument,
} from "../../src";

const image = createImage("https://example.com/a.png", {
  alt: "保留图片元数据",
  width: 120,
  height: 80,
});

describe("selected image cut history", () => {
  it.each([
    { onlyImage: false, saveBlock: false },
    { onlyImage: true, saveBlock: false },
    { onlyImage: false, saveBlock: true },
    { onlyImage: true, saveBlock: true },
  ])(
    "restores the exact source (only image: $onlyImage, save block: $saveBlock)",
    ({ onlyImage, saveBlock }) => {
      const document = createDocument(
        onlyImage
          ? [image]
          : [
              createParagraph([createText("未剪前文", { bold: true })]),
              image,
              createParagraph([createText("未剪后文", { italic: true })]),
            ],
      );
      const original = structuredClone(document);
      const blockSelection = createBlockSelection([onlyImage ? 0 : 1]);
      const html = getClipboardHtml(document, blockSelection)!;
      const result = deleteImageCommand.execute({
        context: { document },
        payload: { selection: blockSelection },
      });
      expect(result.ok).toBe(true);
      const after = applyTransaction(document, result.transaction!);
      expect(after.children).toEqual(
        onlyImage ? [createParagraph()] : [document.children[0], document.children[2]],
      );
      expect(result.transaction!.operations).toHaveLength(onlyImage ? 2 : 1);
      expect(isValidPoint(after, result.selection!.anchor)).toBe(true);
      expect(validateDocument(after).valid).toBe(true);
      const history = recordHistory({
        history: createHistoryState(),
        before: createHistorySnapshot(
          document,
          undefined,
          saveBlock ? blockSelection : undefined,
        ),
        after: createHistorySnapshot(after, result.selection),
        transaction: result.transaction!,
      });
      expect(history.undoStack).toHaveLength(1);
      const undone = undoHistory(history)!;
      expect(undone.document).toEqual(original);
      expect(undone.selection).toBeUndefined();
      expect(undone.blockSelection).toEqual(saveBlock ? blockSelection : undefined);
      expect(undone.history.undoStack).toHaveLength(0);
      const redone = redoHistory(undone.history)!;
      expect(redone.document).toEqual(after);
      expect(redone.selection).toEqual(result.selection);
      expect(redone).not.toHaveProperty("blockSelection");
      expect(parseHtml(html)?.blocks).toEqual([image]);
      expect(document).toEqual(original);
    },
  );

  it("keeps image cut and paste as two independently reversible edits", () => {
    const document = createDocument([image, createParagraph([createText("目标")])]);
    const selection = createBlockSelection([0]);
    const html = getClipboardHtml(document, selection)!;
    const cut = deleteImageCommand.execute({
      context: { document },
      payload: { selection },
    });
    const cutDocument = applyTransaction(document, cut.transaction!);
    const cutHistory = recordHistory({
      history: createHistoryState(),
      before: createHistorySnapshot(document, undefined, selection),
      after: createHistorySnapshot(cutDocument, cut.selection),
      transaction: cut.transaction!,
    });
    const pasted = pasteCommand.execute({
      context: { document: cutDocument, selection: cut.selection! },
      payload: { fragment: parseHtml(html)! },
    });
    expect(pasted.ok).toBe(true);
    const pastedDocument = applyTransaction(cutDocument, pasted.transaction!);
    const history = recordHistory({
      history: cutHistory,
      before: createHistorySnapshot(cutDocument, cut.selection),
      after: createHistorySnapshot(pastedDocument, pasted.selection),
      transaction: pasted.transaction!,
    });
    expect(history.undoStack).toHaveLength(2);
    const undoPaste = undoHistory(history)!;
    expect(undoPaste.document).toEqual(cutDocument);
    expect(undoPaste.selection).toEqual(cut.selection);
    const undoCut = undoHistory(undoPaste.history)!;
    expect(undoCut.document).toEqual(document);
    expect(undoCut.blockSelection).toEqual(selection);
    const redoCut = redoHistory(undoCut.history)!;
    const redoPaste = redoHistory(redoCut.history)!;
    expect(redoPaste.document).toEqual(pastedDocument);
    expect(redoPaste.selection).toEqual(pasted.selection);
  });
});

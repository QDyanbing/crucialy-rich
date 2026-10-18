import { describe, expect, it } from "vitest";
import {
  applyTransaction,
  createCodeBlock,
  createDocument,
  createHistorySnapshot,
  createHistoryState,
  createParagraph,
  createText,
  insertTextCommand,
  isValidPoint,
  parsePlainText,
  pasteCommand,
  recordHistory,
  redoHistory,
  undoHistory,
} from "../../src";

describe("CodeBlock paste normalized caret and history", () => {
  it.each([
    {
      name: "caret in a later text node",
      document: createDocument([
        createCodeBlock([createText("前"), createText("后尾")]),
      ]),
      selection: {
        anchor: { path: [0, 1], offset: 1 },
        focus: { path: [0, 1], offset: 1 },
      },
      expected: "前后甲\n乙尾",
    },
    {
      name: "backward selection within a later text node",
      document: createDocument([
        createCodeBlock([createText("前"), createText("旧文尾")]),
      ]),
      selection: {
        anchor: { path: [0, 1], offset: 2 },
        focus: { path: [0, 1], offset: 1 },
      },
      expected: "前旧甲\n乙尾",
    },
    {
      name: "backward range across blocks",
      document: createDocument([
        createCodeBlock([createText("前"), createText("旧头")]),
        createParagraph([createText("结尾", { bold: true })]),
      ]),
      selection: {
        anchor: { path: [1, 0], offset: 1 },
        focus: { path: [0, 1], offset: 1 },
      },
      expected: "前旧甲\n乙尾",
    },
  ])(
    "restores $name and permits typing at the normalized caret",
    ({ document, selection, expected }) => {
      const result = pasteCommand.execute({
        context: { document, selection },
        payload: { fragment: parsePlainText("甲\n乙")! },
      });
      if (!result.transaction || !result.selection) {
        throw new Error("Code paste must return a transaction and caret.");
      }
      const after = applyTransaction(document, result.transaction);
      expect(after).toEqual(createDocument([createCodeBlock([createText(expected)])]));
      expect(result.selection).toEqual({
        anchor: { path: [0, 0], offset: 5 },
        focus: { path: [0, 0], offset: 5 },
      });
      expect(isValidPoint(after, result.selection.anchor)).toBe(true);
      const history = recordHistory({
        after: createHistorySnapshot(after, result.selection),
        before: createHistorySnapshot(document, selection),
        history: createHistoryState(),
        transaction: result.transaction,
      });
      const undone = undoHistory(history)!;
      const redone = redoHistory(undone.history)!;
      expect(history.undoStack).toHaveLength(1);
      expect(undone.document).toEqual(document);
      expect(undone.selection).toEqual(selection);
      expect(redone.document).toEqual(after);
      expect(redone.selection).toEqual(result.selection);
      const typing = insertTextCommand.execute({
        context: { document: after, selection: result.selection },
        payload: { text: "续" },
      });
      expect(applyTransaction(after, typing.transaction!)).toEqual(
        createDocument([createCodeBlock([createText(`${expected.slice(0, 5)}续尾`)])]),
      );
    },
  );
});

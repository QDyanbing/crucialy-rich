import { describe, expect, it } from "vitest";
import {
  applyTransaction,
  createBulletList,
  createDocument,
  createHistorySnapshot,
  createHistoryState,
  createListItem,
  createOrderedList,
  createTaskItem,
  createTaskList,
  createText,
  insertTextCommand,
  parsePlainText,
  pasteCommand,
  recordHistory,
  redoHistory,
  undoHistory,
} from "../../src";

const children = [
  createText("保", { bold: true }),
  createText("删除"),
  createText("尾", { link: { href: "https://example.com" } }),
];
const nested = createBulletList([createListItem([createText("子项")])]);

describe("list paste history", () => {
  it.each([
    {
      name: "bullet",
      list: createBulletList([createListItem(children, nested)]),
      path: [0, 0],
    },
    {
      name: "ordered",
      list: createOrderedList([createListItem(children, nested)], 7),
      path: [0, 0],
    },
    {
      name: "task",
      list: createTaskList([createTaskItem(children, true, nested)]),
      path: [0, 0],
    },
    {
      name: "nested task",
      list: createBulletList([
        createListItem(
          [createText("父项")],
          createTaskList([createTaskItem(children, true, nested)]),
        ),
      ]),
      path: [0, 0, 1, 0],
    },
  ])(
    "restores $name structure, marks and backward selection as one entry",
    ({ list, path }) => {
      const document = createDocument([list]);
      const selection = {
        anchor: { path: [...path, 2], offset: 0 },
        focus: { path: [...path, 1], offset: 0 },
      };
      const result = pasteCommand.execute({
        context: { document, selection },
        payload: { fragment: parsePlainText("甲\n乙")! },
      });
      if (!result.transaction || !result.selection) {
        throw new Error("List paste must return a transaction and caret.");
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
      expect(history.undoStack).toHaveLength(1);
      expect(undone.document).toEqual(document);
      expect(undone.selection).toEqual(selection);
      expect(redone.document).toEqual(after);
      expect(redone.selection).toEqual(result.selection);
      expect(redone.history.redoStack).toHaveLength(0);

      const typing = insertTextCommand.execute({
        context: { document: after, selection: result.selection },
        payload: { text: "续" },
      });
      const nextHistory = recordHistory({
        after: createHistorySnapshot(
          applyTransaction(after, typing.transaction!),
          typing.selection,
        ),
        before: createHistorySnapshot(after, result.selection),
        batch: "typing",
        history,
        transaction: typing.transaction!,
      });
      expect(nextHistory.undoStack).toHaveLength(2);
      const undoTyping = undoHistory(nextHistory)!;
      expect(undoTyping.document).toEqual(after);
      expect(undoTyping.selection).toEqual(result.selection);
      expect(undoHistory(undoTyping.history)?.document).toEqual(document);
      expect(undoHistory(undoTyping.history)?.selection).toEqual(selection);
    },
  );
});

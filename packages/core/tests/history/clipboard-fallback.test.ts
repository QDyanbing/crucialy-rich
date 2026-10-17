import { describe, expect, it } from "vitest";
import {
  applyTransaction,
  canExecutePasteCommand,
  createDocument,
  createHistorySnapshot,
  createHistoryState,
  createListItem,
  createOrderedList,
  createParagraph,
  createTableCell,
  createTableRow,
  createTaskItem,
  createTaskList,
  createText,
  DEFAULT_CLIPBOARD_PARSERS,
  getNodeAtPath,
  parseClipboardData,
  pasteCommand,
  recordHistory,
  redoHistory,
  undoHistory,
} from "../../src";

describe("target-aware clipboard fallback history", () => {
  it.each([
    {
      name: "cell",
      document: createDocument([
        {
          type: "table",
          children: [
            createTableRow([
              createTableCell([
                createParagraph([createText("开头")]),
                createParagraph([createText("结尾")]),
              ]),
              createTableCell([createParagraph([createText("邻格")])]),
            ]),
          ],
        },
      ]),
      selection: {
        anchor: { path: [0, 0, 0, 0, 0], offset: 1 },
        focus: { path: [0, 0, 0, 1, 0], offset: 1 },
      },
      path: [0, 0, 0, 1, 0],
    },
    {
      name: "task",
      document: createDocument([
        createTaskList([
          createTaskItem(
            [createText("开旧尾")],
            true,
            createOrderedList([createListItem([createText("原子项")])], 4),
          ),
        ]),
      ]),
      selection: {
        anchor: { path: [0, 0, 0], offset: 2 },
        focus: { path: [0, 0, 0], offset: 1 },
      },
      path: [0, 1, 0],
    },
  ])(
    "records the chosen plain fragment once for $name",
    ({ document, selection, path }) => {
      const context = { document, selection };
      const fragment = parseClipboardData(
        {
          types: ["text/html", "text/plain"],
          getData: (type) => (type === "text/html" ? "<p>富内容</p>" : "甲\n乙"),
        },
        DEFAULT_CLIPBOARD_PARSERS,
        (candidate) =>
          canExecutePasteCommand({ context, payload: { fragment: candidate } }),
      );
      expect(fragment?.mimeType).toBe("text/plain");
      const result = pasteCommand.execute({ context, payload: { fragment } });
      if (!result.transaction || !result.selection) {
        throw new Error("Fallback must create one paste transaction.");
      }
      const after = applyTransaction(document, result.transaction);
      expect(getNodeAtPath(after, path)).toMatchObject({ text: "乙尾" });
      expect(result.selection.anchor).toEqual({ path, offset: 1 });
      const history = recordHistory({
        after: createHistorySnapshot(after, result.selection),
        before: createHistorySnapshot(document, selection),
        transaction: result.transaction,
        history: createHistoryState(),
      });
      const undone = undoHistory(history)!;
      const redone = redoHistory(undone.history)!;
      expect(history.undoStack).toHaveLength(1);
      expect(undone.document).toEqual(document);
      expect(undone.selection).toEqual(selection);
      expect(redone.document).toEqual(after);
      expect(redone.selection).toEqual(result.selection);
      expect(redone.history.redoStack).toHaveLength(0);
    },
  );
});

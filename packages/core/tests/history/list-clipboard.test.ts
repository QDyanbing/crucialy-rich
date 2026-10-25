import { describe, expect, it } from "vitest";
import {
  applyTransaction,
  canExecutePasteCommand,
  createBulletList,
  createDocument,
  createHistorySnapshot,
  createHistoryState,
  createListItem,
  createOrderedList,
  createParagraph,
  createTaskItem,
  createTaskList,
  createText,
  DEFAULT_CLIPBOARD_PARSERS,
  getClipboardHtml,
  getClipboardText,
  isListNode,
  parseClipboardData,
  pasteCommand,
  recordHistory,
  redoHistory,
  undoHistory,
  validateDocument,
} from "../../src";

describe("structured list clipboard history", () => {
  for (const type of ["bullet", "ordered", "task"]) {
    it.each([false, true])(
      `pastes ${type} items as one undoable entry (backward copy: %s)`,
      (backward) => {
        const items = ["未选", "甲乙", "丙丁"].map((text) =>
          createListItem([createText(text, { bold: true })]),
        );
        const list =
          type === "ordered"
            ? createOrderedList(items, 7)
            : type === "task"
              ? createTaskList(
                  items.map((item, index) =>
                    createTaskItem(item.children, index === 1),
                  ),
                )
              : createBulletList(items);
        const source = createDocument([list]);
        const originalSource = structuredClone(source);
        const start = { path: [0, 1, 0], offset: 1 };
        const end = { path: [0, 2, 0], offset: 1 };
        const copySelection = backward
          ? { anchor: end, focus: start }
          : { anchor: start, focus: end };
        const formats: Record<string, string> = {
          "text/plain": getClipboardText(source, copySelection)!,
          "text/html": getClipboardHtml(source, copySelection)!,
        };
        const document = createDocument([createParagraph([createText("正文")])]);
        const selection = {
          anchor: { path: [0, 0], offset: 0 },
          focus: { path: [0, 0], offset: 2 },
        };
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
        const pastedList = after.children.find(isListNode)!;
        expect(pastedList.type).toBe(list.type);
        expect(
          pastedList.children.map((item) =>
            item.children.map((text) => text.text).join(""),
          ),
        ).toEqual(["乙", "丙"]);
        if (pastedList.type === "orderedList") expect(pastedList.start).toBe(8);
        if (pastedList.type === "taskList")
          expect(
            pastedList.children.map((item) => item.type === "taskItem" && item.checked),
          ).toEqual([true, false]);
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
        expect(redoHistory(undone.history)?.document).toEqual(after);
        expect(redoHistory(undone.history)?.selection).toEqual(result.selection);
        expect(source).toEqual(originalSource);
      },
    );
  }
});

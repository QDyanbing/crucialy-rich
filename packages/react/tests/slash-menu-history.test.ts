import {
  applyTransaction,
  createDefaultCommandRegistry,
  createDocument,
  createHistorySnapshot,
  createHistoryState,
  createParagraph,
  createText,
  isValidPoint,
  recordHistory,
  redoHistory,
  undoHistory,
  validateDocument,
} from "@crucialy-rich/core";
import { describe, expect, it } from "vitest";
import {
  createDefaultSlashCommandItems,
  executeSlashCommand,
  findSlashMenuTrigger,
} from "../src";

const types: Record<string, string> = {
  paragraph: "paragraph",
  "heading-1": "heading",
  "heading-2": "heading",
  "heading-3": "heading",
  quote: "quote",
  "code-block": "codeBlock",
  "bullet-list": "bulletList",
  "ordered-list": "orderedList",
  "task-list": "taskList",
  divider: "divider",
};

describe("default Slash command History", () => {
  for (const item of createDefaultSlashCommandItems()) {
    it.each(["/", "/标题"])(
      `applies ${item.id} and restores a %s trigger in one undo`,
      (text) => {
        const document = createDocument([
          createParagraph([createText(`${text}正文`)]),
          createParagraph([createText("未选邻段", { italic: true })]),
        ]);
        const point = { path: [0, 0], offset: text.length };
        const selection = { anchor: point, focus: { ...point, path: [...point.path] } };
        const trigger = findSlashMenuTrigger(document, selection)!;
        const result = executeSlashCommand(
          item,
          createDefaultCommandRegistry(),
          { document, selection },
          trigger,
        ).result;
        expect(result.ok).toBe(true);
        expect(result.transaction!.operations[0]!.type).toBe("delete_text");
        const after = applyTransaction(document, result.transaction!);
        expect(validateDocument(after).valid).toBe(true);
        const target = after.children[item.id === "divider" ? 1 : 0]!;
        expect(target.type).toBe(types[item.id]);
        if (target.type === "heading") {
          expect(target.level).toBe(Number(item.id.at(-1)));
        }
        if (target.type === "divider") {
          expect(after.children[2]).toEqual(createParagraph([createText("正文")]));
        } else if (
          target.type === "bulletList" ||
          target.type === "orderedList" ||
          target.type === "taskList"
        ) {
          expect(target.children[0]!.children).toEqual([createText("正文")]);
          if (target.type === "taskList")
            expect(target.children[0]).toMatchObject({
              type: "taskItem",
              checked: false,
            });
        } else {
          expect(target.children).toEqual([createText("正文")]);
        }
        expect(JSON.stringify(after)).not.toContain(text);
        expect(after.children.at(-1)).toEqual(document.children[1]);
        expect(result.selection).toBeDefined();
        expect(isValidPoint(after, result.selection!.anchor)).toBe(true);
        expect(isValidPoint(after, result.selection!.focus)).toBe(true);
        const history = recordHistory({
          history: createHistoryState(),
          transaction: result.transaction!,
          before: createHistorySnapshot(document, selection),
          after: createHistorySnapshot(after, result.selection),
        });
        expect(history.undoStack).toHaveLength(1);
        const undo = undoHistory(history)!;
        expect(undo.document).toEqual(document);
        expect(undo.selection).toEqual(selection);
        expect(undo.history.undoStack).toHaveLength(0);
        const redo = redoHistory(undo.history)!;
        expect(redo.document).toEqual(after);
        expect(redo.selection).toEqual(result.selection);
      },
    );
  }
});

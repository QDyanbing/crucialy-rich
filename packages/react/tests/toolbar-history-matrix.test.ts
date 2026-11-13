import {
  applyTransaction,
  createDefaultCommandRegistry,
  createDocument,
  createHistorySnapshot,
  createHistoryState,
  createParagraph,
  createText,
  recordHistory,
  redoHistory,
  undoHistory,
  validateDocument,
  type TextMarks,
} from "@crucialy-rich/core";
import { describe, expect, it } from "vitest";
import {
  createDefaultToolbarItems,
  executeToolbarCommand,
  resolveToolbarItems,
} from "../src";

const marks: Record<string, TextMarks> = {
  bold: { bold: true },
  italic: { italic: true },
  underline: { underline: true },
  strike: { strike: true },
  "inline-code": { code: true },
  link: { link: { href: "https://example.com/docs" } },
};

describe("default Toolbar command History", () => {
  for (const configured of createDefaultToolbarItems({
    link: { href: "https://example.com/docs" },
  })) {
    if (configured.type !== "command") continue;
    it.each([false, true])(
      `applies ${configured.id} with backward=%s as one undoable edit`,
      (backward) => {
        const source =
          configured.id === "clear-formatting"
            ? createText("前文后文", {
                bold: true,
                fontSize: 20,
                link: { href: "https://example.com" },
              })
            : createText("前文后文");
        const document = createDocument([
          createParagraph([source]),
          createParagraph([createText("邻段")]),
        ]);
        const start = { path: [0, 0], offset: 1 };
        const end = { path: [0, 0], offset: 3 };
        const selection = {
          anchor: backward ? end : start,
          focus: backward ? start : end,
        };
        const before = structuredClone(document);
        const registry = createDefaultCommandRegistry();
        const item = resolveToolbarItems([configured], registry, {
          document,
          selection,
        })[0]!;
        if (item.type !== "command") throw new Error("Expected a command.");
        const event = executeToolbarCommand(item, registry, { document, selection });
        expect(event.result.ok).toBe(true);
        expect(event.selection).toEqual(selection);
        const after = applyTransaction(document, event.result.transaction!);
        expect(validateDocument(after).valid).toBe(true);
        expect(after.children[1]).toEqual(document.children[1]);
        if (configured.id === "heading-2" || configured.id === "quote") {
          expect(after.children[0]).toMatchObject({
            type: configured.id === "quote" ? "quote" : "heading",
            children: [createText("前文后文")],
          });
          if (configured.id === "heading-2")
            expect(after.children[0]).toHaveProperty("level", 2);
        } else {
          const expected =
            configured.id === "clear-formatting" ? {} : marks[configured.id]!;
          const block = after.children[0]!;
          expect(block.type).toBe("paragraph");
          if (block.type !== "paragraph") throw new Error("Expected a paragraph.");
          expect(block.children.map((text) => text.text).join("")).toBe("前文后文");
          expect(block.children.find((text) => text.text === "文后")).toEqual(
            createText("文后", expected),
          );
        }
        const history = recordHistory({
          history: createHistoryState(),
          transaction: event.result.transaction!,
          before: createHistorySnapshot(document, event.selection),
          after: createHistorySnapshot(after, event.result.selection),
        });
        expect(history.undoStack).toHaveLength(1);
        const undo = undoHistory(history)!;
        expect(undo.document).toEqual(before);
        expect(undo.selection).toEqual(selection);
        const redo = redoHistory(undo.history)!;
        expect(redo.document).toEqual(after);
        expect(redo.selection).toEqual(event.result.selection);
        expect(document).toEqual(before);
      },
    );
  }
});

import { describe, expect, it } from "vitest";
import {
  applyTransaction,
  createDocument,
  createParagraph,
  createHeading,
  createQuote,
  createCodeBlock,
  createTaskList,
  createTaskItem,
  createTable,
  createText,
  createDefaultCommandRegistry,
  executeCommand,
  getNodeAtPath,
  isValidPoint,
  validateDocument,
  getClipboardText,
  getClipboardHtml,
  parseHtml,
} from "../../src";

describe("existing insertText command as a soft line break primitive", () => {
  it("retains literal LF through model text and HTML clipboard data", () => {
    const document = createDocument([
      createParagraph([createText("前\n后", { bold: true })]),
    ]);
    const selection = {
      anchor: { path: [0, 0], offset: 0 },
      focus: { path: [0, 0], offset: 3 },
    };
    expect(getClipboardText(document, selection)).toBe("前\n后");
    const html = getClipboardHtml(document, selection)!;
    expect(parseHtml(html)!.blocks).toEqual(document.children);
  });
  it.each(["paragraph", "heading", "quote", "code", "task", "cell"])(
    "keeps a LF in the same %s text container",
    (kind) => {
      const nodes = [createText("A\u{1f600}B", { bold: true })];
      const table = createTable(1, 2);
      table.children[0]!.children[0]!.children = [createParagraph(nodes)];
      const block =
        kind === "heading"
          ? createHeading(2, nodes)
          : kind === "quote"
            ? createQuote(nodes)
            : kind === "code"
              ? createCodeBlock(nodes)
              : kind === "task"
                ? createTaskList([createTaskItem(nodes, true)])
                : kind === "cell"
                  ? table
                  : createParagraph(nodes);
      const path =
        kind === "task" ? [0, 0, 0] : kind === "cell" ? [0, 0, 0, 0, 0] : [0, 0];
      const document = createDocument([block, createParagraph([createText("保留")])]);
      const original = structuredClone(document);
      const point = { path, offset: 3 };
      const result = executeCommand(createDefaultCommandRegistry(), "insertText", {
        context: { document, selection: { anchor: point, focus: point } },
        payload: { text: "\n" },
      });
      expect(result.ok).toBe(true);
      const after = applyTransaction(document, result.transaction!);
      expect(getNodeAtPath(after, path)).toMatchObject({ text: "A\u{1f600}\nB" });
      expect(after.children.map((node) => node.type)).toEqual(
        document.children.map((node) => node.type),
      );
      expect(after.children[1]).toEqual(document.children[1]);
      expect(isValidPoint(after, result.selection!.anchor)).toBe(true);
      expect(result.selection!.anchor.offset).toBe(4);
      expect(validateDocument(after).valid).toBe(true);
      expect(document).toEqual(original);
    },
  );

  it.each([false, true])(
    "replaces an explicit cross-block range atomically (%s)",
    (reverse) => {
      const document = createDocument([
        createParagraph([createText("前甲")]),
        createParagraph([createText("乙后")]),
      ]);
      const start = { path: [0, 0], offset: 1 },
        end = { path: [1, 0], offset: 1 };
      const selection = reverse
        ? { anchor: end, focus: start }
        : { anchor: start, focus: end };
      const result = executeCommand(createDefaultCommandRegistry(), "insertText", {
        context: { document, selection },
        payload: { text: "\n" },
      });
      expect(result.transaction!.operations.map((operation) => operation.type)).toEqual(
        ["delete_range", "insert_text"],
      );
      expect(applyTransaction(document, result.transaction!)).toEqual(
        createDocument([createParagraph([createText("前\n后")])]),
      );
      expect(result.selection!.anchor.offset).toBe(2);
    },
  );

  it("does not apply the code block double-Enter exit rule to literal LF insertion", () => {
    const document = createDocument([createCodeBlock([createText("A\n")])]);
    const point = { path: [0, 0], offset: 2 };
    const result = executeCommand(createDefaultCommandRegistry(), "insertText", {
      context: { document, selection: { anchor: point, focus: point } },
      payload: { text: "\n" },
    });
    expect(applyTransaction(document, result.transaction!)).toEqual(
      createDocument([createCodeBlock([createText("A\n\n")])]),
    );
  });
});

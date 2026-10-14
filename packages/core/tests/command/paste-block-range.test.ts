import { describe, expect, it } from "vitest";

import {
  applyTransaction,
  canExecutePasteCommand,
  createDocument,
  createHeading,
  createParagraph,
  createQuote,
  createText,
  parseHtml,
  parseMarkdown,
  parsePlainText,
  pasteCommand,
  validateDocument,
} from "../../src";

describe("paste over continuous top-level text blocks", () => {
  describe.each(["forward", "backward"])("%s selection", (direction) => {
    it.each([
      {
        name: "plain text",
        fragment: parsePlainText("新")!,
        blocks: [createHeading(2, [createText("开新尾")])],
        point: { path: [0, 0], offset: 2 },
      },
      {
        name: "HTML",
        fragment: parseHtml("<p><strong>新</strong></p>")!,
        blocks: [
          createHeading(2, [createText("开")]),
          createParagraph([createText("新", { bold: true })]),
          createHeading(2, [createText("尾")]),
        ],
        point: { path: [1, 0], offset: 1 },
      },
      {
        name: "Markdown",
        fragment: parseMarkdown("# 新")!,
        blocks: [
          createHeading(2, [createText("开")]),
          createHeading(1, [createText("新")]),
          createHeading(2, [createText("尾")]),
        ],
        point: { path: [1, 0], offset: 1 },
      },
    ])("replaces the range with $name", ({ fragment, blocks, point }) => {
      const document = createDocument([
        createHeading(2, [createText("开头")]),
        createParagraph([createText("中间")]),
        createQuote([createText("结尾")]),
        createParagraph([createText("后方")]),
      ]);
      const snapshot = structuredClone(document);
      const start = { path: [0, 0], offset: 1 };
      const end = { path: [2, 0], offset: 1 };
      const input = {
        context: {
          document,
          selection: {
            anchor: direction === "forward" ? start : end,
            focus: direction === "forward" ? end : start,
          },
        },
        payload: { fragment },
      };
      const result = pasteCommand.execute(input);
      const next = applyTransaction(document, result.transaction!);

      expect(canExecutePasteCommand(input)).toBe(true);
      expect(result.transaction?.operations[0]?.type).toBe("delete_range");
      expect(next).toEqual(
        createDocument([...blocks, createParagraph([createText("后方")])]),
      );
      expect(result.selection).toEqual({ anchor: point, focus: point });
      expect(validateDocument(next).valid).toBe(true);
      expect(document).toEqual(snapshot);
    });
  });

  it("keeps empty clipboard lines between the retained prefix and suffix", () => {
    const document = createDocument([
      createParagraph([createText("开头")]),
      createParagraph([createText("结尾")]),
    ]);
    const result = pasteCommand.execute({
      context: {
        document,
        selection: {
          anchor: { path: [0, 0], offset: 1 },
          focus: { path: [1, 0], offset: 1 },
        },
      },
      payload: { fragment: parsePlainText("第一行\n\n第三行")! },
    });

    expect(applyTransaction(document, result.transaction!)).toEqual(
      createDocument([
        createParagraph([createText("开第一行")]),
        createParagraph(),
        createParagraph([createText("第三行尾")]),
      ]),
    );
    expect(result.selection?.anchor).toEqual({ path: [2, 0], offset: 3 });
  });
});

import { describe, expect, it } from "vitest";

import {
  createDocument,
  createHeading,
  createParagraph,
  createQuote,
  createText,
} from "../../src/model";
import {
  applySetBlockType,
  createSetBlockTypeOperation,
  type BlockTypeSpec,
  type SetBlockTypeOperation,
} from "../../src/operation";

describe("set block type operation", () => {
  it("creates an isolated operation", () => {
    const path = [0];
    const block: BlockTypeSpec = { level: 2, type: "heading" };
    const operation = createSetBlockTypeOperation(path, block);

    path[0] = 1;
    block.level = 3;

    expect(operation).toEqual({
      block: { level: 2, type: "heading" },
      path: [0],
      type: "set_block_type",
    });
    expect(operation.path).not.toBe(path);
    expect(operation.block).not.toBe(block);
  });

  it("switches a paragraph to a heading without losing text or marks", () => {
    const document = createDocument([
      createParagraph([createText("标题", { bold: true, fontSize: 24 })]),
    ]);
    const result = applySetBlockType(
      document,
      createSetBlockTypeOperation([0], { level: 2, type: "heading" }),
    );

    expect(result).toEqual({
      children: [
        {
          children: [
            {
              marks: { bold: true, fontSize: 24 },
              text: "标题",
              type: "text",
            },
          ],
          level: 2,
          type: "heading",
        },
      ],
      type: "document",
    });
    expect(result).not.toBe(document);
    expect(result.children[0]?.children).toBe(document.children[0]?.children);
    expect(document.children[0]?.type).toBe("paragraph");
  });

  it("updates a heading level", () => {
    const document = createDocument([createHeading(2, [createText("标题")])]);
    const result = applySetBlockType(
      document,
      createSetBlockTypeOperation([0], { level: 4, type: "heading" }),
    );

    expect(result.children[0]).toMatchObject({ level: 4, type: "heading" });
  });

  it("switches between heading, quote, and paragraph", () => {
    const document = createDocument([
      createHeading(1, [createText("第一块")]),
      createQuote([createText("第二块")]),
    ]);
    const quoted = applySetBlockType(
      document,
      createSetBlockTypeOperation([0], { type: "quote" }),
    );
    const paragraph = applySetBlockType(
      quoted,
      createSetBlockTypeOperation([1], { type: "paragraph" }),
    );

    expect(paragraph.children).toEqual([
      { children: [{ text: "第一块", type: "text" }], type: "quote" },
      { children: [{ text: "第二块", type: "text" }], type: "paragraph" },
    ]);
  });

  it("switches to a plain code block and back to a paragraph", () => {
    const document = createDocument([
      createParagraph([createText("const value = 1;", { bold: true })]),
    ]);
    const codeDocument = applySetBlockType(
      document,
      createSetBlockTypeOperation([0], { type: "codeBlock" }),
    );
    const paragraphDocument = applySetBlockType(
      codeDocument,
      createSetBlockTypeOperation([0], { type: "paragraph" }),
    );

    expect(codeDocument.children[0]).toEqual({
      children: [{ text: "const value = 1;", type: "text" }],
      type: "codeBlock",
    });
    expect(paragraphDocument.children[0]).toEqual({
      children: [{ text: "const value = 1;", type: "text" }],
      type: "paragraph",
    });
  });

  it("updates only the block at the target path", () => {
    const document = createDocument([
      createParagraph([createText("第一段")]),
      createParagraph([createText("第二段")]),
      createParagraph([createText("第三段")]),
    ]);
    const result = applySetBlockType(
      document,
      createSetBlockTypeOperation([1], { type: "quote" }),
    );

    expect(result.children.map((block) => block.type)).toEqual([
      "paragraph",
      "quote",
      "paragraph",
    ]);
    expect(result.children[0]).toBe(document.children[0]);
    expect(result.children[2]).toBe(document.children[2]);
  });

  it("returns the original document when the block type is unchanged", () => {
    const paragraph = createDocument([createParagraph([createText("正文")])]);
    const heading = createDocument([createHeading(2, [createText("标题")])]);

    expect(
      applySetBlockType(
        paragraph,
        createSetBlockTypeOperation([0], { type: "paragraph" }),
      ),
    ).toBe(paragraph);
    expect(
      applySetBlockType(
        heading,
        createSetBlockTypeOperation([0], { level: 2, type: "heading" }),
      ),
    ).toBe(heading);
  });

  it("rejects invalid block paths", () => {
    const document = createDocument([createParagraph([createText("正文")])]);

    for (const path of [[], [0, 0], [-1], [1], [0.5]]) {
      expect(() =>
        applySetBlockType(
          document,
          createSetBlockTypeOperation(path, { type: "quote" }),
        ),
      ).toThrow("set block type path must reference a block node");
    }
  });

  it("rejects invalid block type targets during creation and apply", () => {
    const invalidBlock = { level: 7, type: "heading" } as unknown as BlockTypeSpec;
    const invalidOperation = {
      block: invalidBlock,
      path: [0],
      type: "set_block_type",
    } as SetBlockTypeOperation;
    const document = createDocument([createParagraph([createText("正文")])]);

    expect(() => createSetBlockTypeOperation([0], invalidBlock)).toThrow(
      "invalid block type target",
    );
    expect(() => applySetBlockType(document, invalidOperation)).toThrow(
      "invalid block type target",
    );
  });
});

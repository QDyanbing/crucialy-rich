import { describe, expect, it } from "vitest";

import {
  createDivider,
  createDocument,
  createParagraph,
  createText,
} from "../../src/model";
import { applyInsertBlock, createInsertBlockOperation } from "../../src/operation";

describe("insert block operation", () => {
  it("creates a detached operation value", () => {
    const path = [1];
    const block = createParagraph([createText("新增", { bold: true })]);
    const operation = createInsertBlockOperation(path, block);

    path[0] = 9;
    block.children[0]!.text = "已改";

    expect(operation).toEqual({
      block: {
        children: [{ marks: { bold: true }, text: "新增", type: "text" }],
        type: "paragraph",
      },
      path: [1],
      type: "insert_block",
    });
  });

  it("inserts a divider at a document position", () => {
    const document = createDocument([
      createParagraph([createText("上")]),
      createParagraph([createText("下")]),
    ]);
    const result = applyInsertBlock(
      document,
      createInsertBlockOperation([1], createDivider()),
    );

    expect(result.children.map((block) => block.type)).toEqual([
      "paragraph",
      "divider",
      "paragraph",
    ]);
    expect(document.children).toHaveLength(2);
  });

  it("supports document boundaries and rejects invalid paths", () => {
    const document = createDocument();

    expect(
      applyInsertBlock(document, createInsertBlockOperation([0], createDivider()))
        .children[0]?.type,
    ).toBe("divider");
    expect(
      applyInsertBlock(document, createInsertBlockOperation([1], createDivider()))
        .children[1]?.type,
    ).toBe("divider");
    expect(() =>
      applyInsertBlock(document, createInsertBlockOperation([2], createDivider())),
    ).toThrow("insert block path must reference a document position");
    expect(() =>
      applyInsertBlock(document, createInsertBlockOperation([0, 0], createDivider())),
    ).toThrow("insert block path must reference a document position");
  });
});

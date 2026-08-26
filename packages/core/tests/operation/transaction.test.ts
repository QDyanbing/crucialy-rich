import { describe, expect, it } from "vitest";

import {
  createDocument,
  createParagraph,
  createText,
  type DocumentNode,
} from "../../src/model";
import {
  applyOperation,
  applyTransaction,
  createDeleteTextOperation,
  createInsertTextOperation,
  createMergeBlockOperation,
  createSetBlockTypeOperation,
  createSetMarkAttributeOperation,
  createSplitBlockOperation,
  createToggleMarkOperation,
  createTransaction,
} from "../../src/operation";

describe("createTransaction", () => {
  it("creates a transaction from operations", () => {
    const operation = createInsertTextOperation({ path: [0, 0], offset: 1 }, "新");

    expect(createTransaction([operation])).toEqual({
      operations: [operation],
    });
  });

  it("clones operation paths when creating the transaction", () => {
    const insertPath = [0, 0];
    const deleteAnchorPath = [0, 0];
    const deleteFocusPath = [0, 0];
    const transaction = createTransaction([
      createInsertTextOperation({ path: insertPath, offset: 1 }, "新"),
      createDeleteTextOperation({
        anchor: { path: deleteAnchorPath, offset: 0 },
        focus: { path: deleteFocusPath, offset: 1 },
      }),
    ]);

    insertPath[0] = 9;
    deleteAnchorPath[0] = 8;
    deleteFocusPath[0] = 7;

    expect(transaction.operations[0]).toMatchObject({
      point: { path: [0, 0] },
    });
    expect(transaction.operations[1]).toMatchObject({
      range: {
        anchor: { path: [0, 0] },
        focus: { path: [0, 0] },
      },
    });
  });
});

describe("applyOperation", () => {
  it("applies an insert text operation", () => {
    const document = createDocument([createParagraph([createText("你好")])]);
    const result = applyOperation(
      document,
      createInsertTextOperation({ path: [0, 0], offset: 2 }, "世界"),
    );

    expect(result.children[0]?.children[0]?.text).toBe("你好世界");
  });

  it("applies a delete text operation", () => {
    const document = createDocument([createParagraph([createText("你好世界")])]);
    const result = applyOperation(
      document,
      createDeleteTextOperation({
        anchor: { path: [0, 0], offset: 2 },
        focus: { path: [0, 0], offset: 4 },
      }),
    );

    expect(result.children[0]?.children[0]?.text).toBe("你好");
  });

  it("applies a split block operation", () => {
    const document = createDocument([createParagraph([createText("你好世界")])]);
    const result = applyOperation(
      document,
      createSplitBlockOperation({ path: [0, 0], offset: 2 }),
    );

    expect(result.children).toHaveLength(2);
    expect(result.children[0]?.children[0]?.text).toBe("你好");
    expect(result.children[1]?.children[0]?.text).toBe("世界");
  });

  it("applies a merge block operation", () => {
    const document = createDocument([
      createParagraph([createText("你好")]),
      createParagraph([createText("世界")]),
    ]);
    const result = applyOperation(
      document,
      createMergeBlockOperation({ path: [1, 0], offset: 0 }),
    );

    expect(result.children).toHaveLength(1);
    expect(result.children[0]?.children.map((node) => node.text)).toEqual([
      "你好",
      "世界",
    ]);
  });

  it("applies a set block type operation", () => {
    const document = createDocument([createParagraph([createText("标题")])]);
    const result = applyOperation(
      document,
      createSetBlockTypeOperation([0], { level: 2, type: "heading" }),
    );

    expect(result.children[0]).toEqual({
      children: [{ text: "标题", type: "text" }],
      level: 2,
      type: "heading",
    });
  });

  it("applies a toggle mark operation", () => {
    const document = createDocument([createParagraph([createText("你好")])]);
    const result = applyOperation(
      document,
      createToggleMarkOperation(
        {
          anchor: { path: [0, 0], offset: 0 },
          focus: { path: [0, 0], offset: 2 },
        },
        "bold",
      ),
    );

    expect(result.children[0]?.children[0]).toEqual({
      type: "text",
      text: "你好",
      marks: { bold: true },
    });
  });
});

describe("applyTransaction", () => {
  it("applies multiple operations in order", () => {
    const document = createDocument([createParagraph([createText("你好")])]);
    const transaction = createTransaction([
      createInsertTextOperation({ path: [0, 0], offset: 2 }, "世界"),
      createDeleteTextOperation({
        anchor: { path: [0, 0], offset: 0 },
        focus: { path: [0, 0], offset: 2 },
      }),
    ]);
    const result = applyTransaction(document, transaction);

    expect(result.children[0]?.children[0]?.text).toBe("世界");
    expect(document.children[0]?.children[0]?.text).toBe("你好");
  });

  it("normalizes the document after applying operations", () => {
    const document: DocumentNode = {
      type: "document",
      children: [],
    };
    const result = applyTransaction(document, createTransaction());

    expect(result.children).toHaveLength(1);
    expect(result.children[0]?.children[0]?.text).toBe("");
  });

  it("clones and applies toggle mark operations", () => {
    const document = createDocument([createParagraph([createText("你好")])]);
    const anchorPath = [0, 0];
    const focusPath = [0, 0];
    const transaction = createTransaction([
      createToggleMarkOperation(
        {
          anchor: { path: anchorPath, offset: 0 },
          focus: { path: focusPath, offset: 2 },
        },
        "bold",
      ),
    ]);

    anchorPath[0] = 9;
    focusPath[0] = 8;

    expect(transaction.operations[0]).toEqual({
      mark: "bold",
      range: {
        anchor: { path: [0, 0], offset: 0 },
        focus: { path: [0, 0], offset: 2 },
      },
      type: "toggle_mark",
    });
    expect(applyTransaction(document, transaction).children[0]?.children[0]).toEqual({
      type: "text",
      text: "你好",
      marks: { bold: true },
    });
  });

  it("clones and applies mark attribute operations", () => {
    const document = createDocument([createParagraph([createText("你好")])]);
    const anchorPath = [0, 0];
    const focusPath = [0, 0];
    const transaction = createTransaction([
      createSetMarkAttributeOperation(
        {
          anchor: { path: anchorPath, offset: 0 },
          focus: { path: focusPath, offset: 2 },
        },
        "fontSize",
        18,
      ),
    ]);

    anchorPath[0] = 9;
    focusPath[0] = 8;

    expect(transaction.operations[0]).toEqual({
      attribute: "fontSize",
      range: {
        anchor: { path: [0, 0], offset: 0 },
        focus: { path: [0, 0], offset: 2 },
      },
      type: "set_mark_attribute",
      value: 18,
    });
    expect(applyTransaction(document, transaction).children[0]?.children[0]).toEqual({
      marks: { fontSize: 18 },
      text: "你好",
      type: "text",
    });
  });

  it("clones and applies set block type operations", () => {
    const document = createDocument([createParagraph([createText("引用")])]);
    const path = [0];
    const block: { level: 3 | 4; type: "heading" } = {
      level: 3,
      type: "heading",
    };
    const transaction = createTransaction([createSetBlockTypeOperation(path, block)]);

    path[0] = 9;
    block.level = 4;

    expect(transaction.operations[0]).toEqual({
      block: { level: 3, type: "heading" },
      path: [0],
      type: "set_block_type",
    });
    expect(applyTransaction(document, transaction).children[0]).toMatchObject({
      level: 3,
      type: "heading",
    });
  });

  it("does not mutate the original document when an operation fails", () => {
    const document = createDocument([createParagraph([createText("你好")])]);
    const transaction = createTransaction([
      createInsertTextOperation({ path: [0, 0], offset: 2 }, "世界"),
      createDeleteTextOperation({
        anchor: { path: [0, 0], offset: 99 },
        focus: { path: [0, 0], offset: 100 },
      }),
    ]);

    expect(() => applyTransaction(document, transaction)).toThrow(RangeError);
    expect(document.children[0]?.children[0]?.text).toBe("你好");
  });
});

import { describe, expect, it } from "vitest";

import { createDocument, createParagraph, createText } from "../../src/model";
import {
  applyOperation,
  applyTransaction,
  createDeleteTextOperation,
  createInsertTextOperation,
  createMergeBlockOperation,
  createSplitBlockOperation,
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
    const document = {
      type: "document",
      children: [],
    } as const;
    const result = applyTransaction(document, createTransaction());

    expect(result.children).toHaveLength(1);
    expect(result.children[0]?.children[0]?.text).toBe("");
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

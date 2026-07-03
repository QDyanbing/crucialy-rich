import { describe, expect, it } from "vitest";

import { createDocument, createParagraph, createText } from "../../src/model";
import {
  applyOperation,
  createDeleteTextOperation,
  createInsertTextOperation,
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
});

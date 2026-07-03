import { describe, expect, it } from "vitest";

import {
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

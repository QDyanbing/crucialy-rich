import { describe, expect, it } from "vitest";

import {
  applyTransaction,
  createDeleteInputTransaction,
  createDocument,
  createParagraph,
  createSelectionAfterDeleteInput,
  createText,
} from "../../src";

describe("createDeleteInputTransaction", () => {
  it("deletes the next character inside a text node", () => {
    const document = createDocument([createParagraph([createText("你好呀")])]);
    const transaction = createDeleteInputTransaction({
      document,
      selection: {
        anchor: { path: [0, 0], offset: 1 },
        focus: { path: [0, 0], offset: 1 },
      },
    });
    const result = applyTransaction(document, transaction);

    expect(transaction.operations[0]).toMatchObject({
      range: {
        anchor: { path: [0, 0], offset: 1 },
        focus: { path: [0, 0], offset: 2 },
      },
      type: "delete_text",
    });
    expect(result.children[0]?.children[0]?.text).toBe("你呀");
  });

  it("keeps selection at the delete point after deleting the next character", () => {
    const document = createDocument([createParagraph([createText("你好呀")])]);

    expect(
      createSelectionAfterDeleteInput({
        document,
        selection: {
          anchor: { path: [0, 0], offset: 1 },
          focus: { path: [0, 0], offset: 1 },
        },
      }),
    ).toEqual({
      anchor: { path: [0, 0], offset: 1 },
      focus: { path: [0, 0], offset: 1 },
    });
  });
});

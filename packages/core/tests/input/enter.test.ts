import { describe, expect, it } from "vitest";

import {
  applyTransaction,
  createDocument,
  createEnterInputTransaction,
  createParagraph,
  createSelectionAfterEnterInput,
  createText,
} from "../../src";

describe("createEnterInputTransaction", () => {
  it("splits a paragraph at the collapsed selection", () => {
    const document = createDocument([createParagraph([createText("你好世界")])]);
    const input = {
      document,
      selection: {
        anchor: { path: [0, 0], offset: 2 },
        focus: { path: [0, 0], offset: 2 },
      },
    };
    const transaction = createEnterInputTransaction(input);
    const result = applyTransaction(document, transaction);

    expect(transaction.operations[0]).toMatchObject({
      point: { path: [0, 0], offset: 2 },
      type: "split_block",
    });
    expect(result.children).toHaveLength(2);
    expect(result.children[0]?.children[0]?.text).toBe("你好");
    expect(result.children[1]?.children[0]?.text).toBe("世界");
  });

  it("moves selection to the new paragraph start", () => {
    const document = createDocument([createParagraph([createText("你好世界")])]);

    expect(
      createSelectionAfterEnterInput({
        document,
        selection: {
          anchor: { path: [0, 0], offset: 2 },
          focus: { path: [0, 0], offset: 2 },
        },
      }),
    ).toEqual({
      anchor: { path: [1, 0], offset: 0 },
      focus: { path: [1, 0], offset: 0 },
    });
  });
});

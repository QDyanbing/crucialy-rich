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

  it("merges with the next paragraph at paragraph end", () => {
    const document = createDocument([
      createParagraph([createText("第一段")]),
      createParagraph([createText("第二段")]),
    ]);
    const input = {
      document,
      selection: {
        anchor: { path: [0, 0], offset: 3 },
        focus: { path: [0, 0], offset: 3 },
      },
    };
    const transaction = createDeleteInputTransaction(input);
    const result = applyTransaction(document, transaction);

    expect(transaction.operations[0]).toMatchObject({
      point: { path: [1, 0], offset: 0 },
      type: "merge_block",
    });
    expect(result.children).toHaveLength(1);
    expect(result.children[0]?.children.map((node) => node.text)).toEqual([
      "第一段",
      "第二段",
    ]);
    expect(createSelectionAfterDeleteInput(input)).toEqual({
      anchor: { path: [0, 0], offset: 3 },
      focus: { path: [0, 0], offset: 3 },
    });
  });

  it("removes the next empty paragraph when deleting at paragraph end", () => {
    const document = createDocument([
      createParagraph([createText("第一段")]),
      createParagraph([createText("")]),
    ]);
    const transaction = createDeleteInputTransaction({
      document,
      selection: {
        anchor: { path: [0, 0], offset: 3 },
        focus: { path: [0, 0], offset: 3 },
      },
    });
    const result = applyTransaction(document, transaction);

    expect(result.children).toHaveLength(1);
    expect(result.children[0]?.children[0]?.text).toBe("第一段");
  });

  it("does nothing at the end of the final paragraph", () => {
    const document = createDocument([createParagraph([createText("第一段")])]);
    const transaction = createDeleteInputTransaction({
      document,
      selection: {
        anchor: { path: [0, 0], offset: 3 },
        focus: { path: [0, 0], offset: 3 },
      },
    });

    expect(transaction.operations).toEqual([]);
  });

  it("does nothing for non-collapsed selections", () => {
    const document = createDocument([createParagraph([createText("第一段")])]);
    const transaction = createDeleteInputTransaction({
      document,
      selection: {
        anchor: { path: [0, 0], offset: 0 },
        focus: { path: [0, 0], offset: 1 },
      },
    });

    expect(transaction.operations).toEqual([]);
  });
});

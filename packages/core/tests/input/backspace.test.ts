import { describe, expect, it } from "vitest";

import {
  applyTransaction,
  createBackspaceInputTransaction,
  createDocument,
  createParagraph,
  createSelectionAfterBackspaceInput,
  createText,
} from "../../src";

describe("createBackspaceInputTransaction", () => {
  it("deletes the previous character inside a text node", () => {
    const document = createDocument([createParagraph([createText("你好呀")])]);
    const transaction = createBackspaceInputTransaction({
      document,
      selection: {
        anchor: { path: [0, 0], offset: 2 },
        focus: { path: [0, 0], offset: 2 },
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

  it("collapses the selection after deleting the previous character", () => {
    const document = createDocument([createParagraph([createText("你好呀")])]);

    expect(
      createSelectionAfterBackspaceInput({
        document,
        selection: {
          anchor: { path: [0, 0], offset: 2 },
          focus: { path: [0, 0], offset: 2 },
        },
      }),
    ).toEqual({
      anchor: { path: [0, 0], offset: 1 },
      focus: { path: [0, 0], offset: 1 },
    });
  });

  it("merges with the previous paragraph at paragraph start", () => {
    const document = createDocument([
      createParagraph([createText("第一段")]),
      createParagraph([createText("第二段")]),
    ]);
    const input = {
      document,
      selection: {
        anchor: { path: [1, 0], offset: 0 },
        focus: { path: [1, 0], offset: 0 },
      },
    };
    const transaction = createBackspaceInputTransaction(input);
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
    expect(createSelectionAfterBackspaceInput(input)).toEqual({
      anchor: { path: [0, 0], offset: 3 },
      focus: { path: [0, 0], offset: 3 },
    });
  });

  it("removes an empty paragraph by merging it into the previous paragraph", () => {
    const document = createDocument([
      createParagraph([createText("第一段")]),
      createParagraph([createText("")]),
    ]);
    const transaction = createBackspaceInputTransaction({
      document,
      selection: {
        anchor: { path: [1, 0], offset: 0 },
        focus: { path: [1, 0], offset: 0 },
      },
    });
    const result = applyTransaction(document, transaction);

    expect(result.children).toHaveLength(1);
    expect(result.children[0]?.children[0]?.text).toBe("第一段");
  });

  it("does nothing at the start of the first paragraph", () => {
    const document = createDocument([createParagraph([createText("第一段")])]);
    const transaction = createBackspaceInputTransaction({
      document,
      selection: {
        anchor: { path: [0, 0], offset: 0 },
        focus: { path: [0, 0], offset: 0 },
      },
    });

    expect(transaction.operations).toEqual([]);
  });

  it("does nothing for non-collapsed selections", () => {
    const document = createDocument([createParagraph([createText("第一段")])]);
    const transaction = createBackspaceInputTransaction({
      document,
      selection: {
        anchor: { path: [0, 0], offset: 0 },
        focus: { path: [0, 0], offset: 1 },
      },
    });

    expect(transaction.operations).toEqual([]);
  });
});

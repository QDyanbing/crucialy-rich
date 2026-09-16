import { describe, expect, it } from "vitest";

import {
  applyTransaction,
  createDeleteInputTransaction,
  createDocument,
  createDivider,
  createParagraph,
  createSelectionAfterDeleteInput,
  createTable,
  createText,
  isTableNode,
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
      "第一段第二段",
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

  it("merges the next paragraph inside a table cell", () => {
    const table = createTable(1, 1);
    table.children[0]!.children[0]!.children = [
      createParagraph([createText("第一段")]),
      createParagraph([createText("第二段")]),
    ];
    const document = createDocument([table]);
    const input = {
      document,
      selection: {
        anchor: { path: [0, 0, 0, 0, 0], offset: 3 },
        focus: { path: [0, 0, 0, 0, 0], offset: 3 },
      },
    };
    const transaction = createDeleteInputTransaction(input);
    const result = applyTransaction(document, transaction);
    const resultTable = result.children[0];

    expect(transaction.operations[0]).toMatchObject({
      point: { path: [0, 0, 0, 1, 0], offset: 0 },
      type: "merge_block",
    });
    expect(isTableNode(resultTable)).toBe(true);

    if (!isTableNode(resultTable)) {
      throw new Error("expected table result");
    }

    expect(resultTable.children[0]?.children[0]?.children).toHaveLength(1);
    expect(createSelectionAfterDeleteInput(input)).toEqual(input.selection);
  });

  it("removes a following divider and keeps the current selection", () => {
    const document = createDocument([
      createParagraph([createText("上")]),
      createDivider(),
      createParagraph([createText("下")]),
    ]);
    const input = {
      document,
      selection: {
        anchor: { offset: 1, path: [0, 0] },
        focus: { offset: 1, path: [0, 0] },
      },
    };
    const transaction = createDeleteInputTransaction(input);

    expect(transaction.operations).toEqual([{ path: [1], type: "remove_block" }]);
    expect(
      applyTransaction(document, transaction).children.map((block) => block.type),
    ).toEqual(["paragraph", "paragraph"]);
    expect(createSelectionAfterDeleteInput(input)).toEqual(input.selection);
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

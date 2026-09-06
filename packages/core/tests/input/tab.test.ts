import { describe, expect, it } from "vitest";

import {
  applyTransaction,
  createBulletList,
  createDocument,
  createListItem,
  createSelectionAfterTabInput,
  createTabInputTransaction,
  createText,
} from "../../src";

describe("list Tab input", () => {
  it("indents a non-first list item", () => {
    const document = createDocument([
      createBulletList([
        createListItem([createText("父项")]),
        createListItem([createText("子项")]),
      ]),
    ]);
    const input = {
      document,
      selection: {
        anchor: { offset: 1, path: [0, 1, 0] },
        focus: { offset: 1, path: [0, 1, 0] },
      },
    };
    const transaction = createTabInputTransaction(input);

    expect(transaction.operations[0]?.type).toBe("indent_list_item");
    expect(createSelectionAfterTabInput(input).anchor.path).toEqual([0, 0, 1, 0, 0]);
    expect(applyTransaction(document, transaction).children[0]).toMatchObject({
      children: [{ nested: { children: [{ children: [{ text: "子项" }] }] } }],
    });
  });

  it("outdents a nested item with Shift+Tab", () => {
    const document = createDocument([
      createBulletList([
        createListItem(
          [createText("父项")],
          createBulletList([createListItem([createText("子项")])]),
        ),
      ]),
    ]);
    const input = {
      document,
      selection: {
        anchor: { offset: 1, path: [0, 0, 1, 0, 0] },
        focus: { offset: 1, path: [0, 0, 1, 0, 0] },
      },
      shiftKey: true,
    };

    expect(createTabInputTransaction(input).operations[0]?.type).toBe(
      "outdent_list_item",
    );
    expect(createSelectionAfterTabInput(input).anchor.path).toEqual([0, 1, 0]);
  });

  it("does not consume Tab for a first item or Shift+Tab at the top level", () => {
    const document = createDocument([
      createBulletList([createListItem([createText("首项")])]),
    ]);
    const selection = {
      anchor: { offset: 0, path: [0, 0, 0] },
      focus: { offset: 0, path: [0, 0, 0] },
    };

    expect(createTabInputTransaction({ document, selection }).operations).toEqual([]);
    expect(
      createTabInputTransaction({ document, selection, shiftKey: true }).operations,
    ).toEqual([]);
  });
});

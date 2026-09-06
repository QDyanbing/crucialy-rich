import { describe, expect, it } from "vitest";

import {
  applyIndentListItem,
  createBulletList,
  createDocument,
  createIndentListItemOperation,
  isListNode,
  createListItem,
  createSelectionAfterIndentListItem,
  createText,
  validateDocument,
} from "../../src";

describe("indent list item operation", () => {
  it("moves an item below its previous sibling", () => {
    const document = createDocument([
      createBulletList([
        createListItem([createText("父项")]),
        createListItem([createText("子项")]),
      ]),
    ]);
    const operation = createIndentListItemOperation({
      offset: 1,
      path: [0, 1, 0],
    });
    const result = applyIndentListItem(document, operation);

    expect(result).toEqual(
      createDocument([
        createBulletList([
          createListItem(
            [createText("父项")],
            createBulletList([createListItem([createText("子项")])]),
          ),
        ]),
      ]),
    );
    expect(createSelectionAfterIndentListItem(document, operation)).toEqual({
      anchor: { offset: 1, path: [0, 0, 1, 0, 0] },
      focus: { offset: 1, path: [0, 0, 1, 0, 0] },
    });
    expect(validateDocument(result).valid).toBe(true);
  });

  it("appends to an existing nested list", () => {
    const document = createDocument([
      createBulletList([
        createListItem(
          [createText("父项")],
          createBulletList([createListItem([createText("已有子项")])]),
        ),
        createListItem([createText("新子项")]),
      ]),
    ]);
    const operation = createIndentListItemOperation({ offset: 0, path: [0, 1, 0] });
    const result = applyIndentListItem(document, operation);

    const list = result.children[0];

    expect(isListNode(list)).toBe(true);
    if (!isListNode(list)) {
      throw new Error("expected list");
    }

    expect(list.children[0]?.nested?.children).toHaveLength(2);
    expect(createSelectionAfterIndentListItem(document, operation).anchor.path).toEqual(
      [0, 0, 1, 1, 0],
    );
  });

  it("rejects first items and items at maximum depth", () => {
    const document = createDocument([
      createBulletList([createListItem([createText("首项")])]),
    ]);

    expect(() =>
      applyIndentListItem(
        document,
        createIndentListItemOperation({ offset: 0, path: [0, 0, 0] }),
      ),
    ).toThrow(RangeError);
  });
});

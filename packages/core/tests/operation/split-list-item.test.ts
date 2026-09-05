import { describe, expect, it } from "vitest";

import {
  applySplitListItem,
  createBulletList,
  createDocument,
  createListItem,
  createSelectionAfterSplitListItem,
  createSplitListItemOperation,
  createText,
} from "../../src";

describe("split list item operation", () => {
  it("splits an item and preserves text marks", () => {
    const document = createDocument([
      createBulletList([
        createListItem([createText("项目", { bold: true })]),
        createListItem([createText("尾项")]),
      ]),
    ]);
    const operation = createSplitListItemOperation({
      offset: 1,
      path: [0, 0, 0],
    });
    const result = applySplitListItem(document, operation);

    expect(result.children[0]).toEqual(
      createBulletList([
        createListItem([createText("项", { bold: true })]),
        createListItem([createText("目", { bold: true })]),
        createListItem([createText("尾项")]),
      ]),
    );
    expect(createSelectionAfterSplitListItem(operation)).toEqual({
      anchor: { offset: 0, path: [0, 1, 0] },
      focus: { offset: 0, path: [0, 1, 0] },
    });
  });

  it("rejects points outside list items", () => {
    const document = createDocument([
      createBulletList([createListItem([createText("项目")])]),
    ]);

    expect(() =>
      applySplitListItem(
        document,
        createSplitListItemOperation({ offset: 0, path: [0, 0] }),
      ),
    ).toThrow(RangeError);
  });
});

import { describe, expect, it } from "vitest";

import {
  canDeleteRange,
  createBulletList,
  createDeleteRangeOperation,
  createDivider,
  createDocument,
  createListItem,
  createParagraph,
  createText,
} from "../../src";

describe("cross-block delete range", () => {
  const range = {
    anchor: { offset: 1, path: [0, 0] },
    focus: { offset: 1, path: [1, 0] },
  };

  it("clones the requested range", () => {
    const operation = createDeleteRangeOperation(range);

    expect(operation).toEqual({ range, type: "delete_range" });
    expect(operation.range).not.toBe(range);
    expect(operation.range.anchor.path).not.toBe(range.anchor.path);
  });

  it("accepts ranges across top-level text blocks", () => {
    const document = createDocument([
      createParagraph([createText("开头")]),
      createParagraph([createText("结尾")]),
    ]);

    expect(canDeleteRange(document, range)).toBe(true);
  });

  it.each([
    ["same block", createDocument([createParagraph([createText("正文")])])],
    [
      "void block",
      createDocument([
        createParagraph([createText("开头")]),
        createDivider(),
        createParagraph([createText("结尾")]),
      ]),
    ],
    [
      "list block",
      createDocument([
        createParagraph([createText("开头")]),
        createBulletList([createListItem([createText("列表")])]),
        createParagraph([createText("结尾")]),
      ]),
    ],
  ])("rejects a range crossing a %s", (_name, document) => {
    const focusBlockIndex = document.children.length - 1;

    expect(
      canDeleteRange(document, {
        anchor: { offset: 0, path: [0, 0] },
        focus: { offset: 1, path: [focusBlockIndex, 0] },
      }),
    ).toBe(false);
  });
});

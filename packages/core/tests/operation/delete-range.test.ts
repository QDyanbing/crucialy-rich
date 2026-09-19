import { describe, expect, it } from "vitest";

import {
  applyDeleteRange,
  applyTransaction,
  canDeleteRange,
  createBulletList,
  createDeleteRangeOperation,
  createSelectionAfterDeleteRange,
  createDivider,
  createDocument,
  createHeading,
  createListItem,
  createParagraph,
  createQuote,
  createText,
  createTransaction,
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

  it.each(["forward", "backward"])(
    "merges the boundary content for a %s range",
    (direction) => {
      const document = createDocument([
        createParagraph([createText("开头")]),
        createParagraph([createText("中间")]),
        createParagraph([createText("结尾")]),
      ]);
      const start = { offset: 1, path: [0, 0] };
      const end = { offset: 1, path: [2, 0] };
      const operation = createDeleteRangeOperation({
        anchor: direction === "forward" ? start : end,
        focus: direction === "forward" ? end : start,
      });

      expect(applyDeleteRange(document, operation)).toEqual(
        createDocument([createParagraph([createText("开尾")])]),
      );
      expect(document.children).toHaveLength(3);
    },
  );

  it("keeps the starting block type and boundary marks", () => {
    const document = createDocument([
      createHeading(2, [createText("标", { bold: true }), createText("题")]),
      createQuote([createText("引", { italic: true }), createText("用")]),
    ]);
    const result = applyDeleteRange(
      document,
      createDeleteRangeOperation({
        anchor: { offset: 1, path: [0, 1] },
        focus: { offset: 1, path: [1, 0] },
      }),
    );

    expect(result).toEqual(
      createDocument([
        createHeading(2, [createText("标", { bold: true }), createText("题用")]),
      ]),
    );
  });

  it("collapses the selection at the retained start offset", () => {
    const document = createDocument([
      createParagraph([createText("前"), createText("缀", { bold: true })]),
      createParagraph([createText("中间")]),
      createParagraph([createText("结尾")]),
    ]);
    const operation = createDeleteRangeOperation({
      anchor: { offset: 1, path: [2, 0] },
      focus: { offset: 1, path: [0, 1] },
    });

    expect(createSelectionAfterDeleteRange(document, operation)).toEqual({
      anchor: { offset: 1, path: [0, 1] },
      focus: { offset: 1, path: [0, 1] },
    });
  });

  it("maps a fully removed starting node onto the remaining suffix", () => {
    const document = createDocument([
      createParagraph([createText("删除")]),
      createParagraph([createText("保留")]),
    ]);
    const operation = createDeleteRangeOperation({
      anchor: { offset: 0, path: [0, 0] },
      focus: { offset: 1, path: [1, 0] },
    });

    expect(createSelectionAfterDeleteRange(document, operation)).toEqual({
      anchor: { offset: 0, path: [0, 0] },
      focus: { offset: 0, path: [0, 0] },
    });
  });

  it("leaves an empty starting block when the whole range is removed", () => {
    const document = createDocument([
      createQuote([createText("全部")]),
      createParagraph([createText("删除")]),
    ]);

    expect(
      applyTransaction(
        document,
        createTransaction([
          createDeleteRangeOperation({
            anchor: { offset: 0, path: [0, 0] },
            focus: { offset: 2, path: [1, 0] },
          }),
        ]),
      ),
    ).toEqual(createDocument([createQuote([createText("")])]));
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

  it("throws without mutating a document for an invalid structural crossing", () => {
    const document = createDocument([
      createParagraph([createText("开头")]),
      createDivider(),
      createParagraph([createText("结尾")]),
    ]);
    const snapshot = structuredClone(document);

    expect(() =>
      applyDeleteRange(
        document,
        createDeleteRangeOperation({
          anchor: { offset: 0, path: [0, 0] },
          focus: { offset: 1, path: [2, 0] },
        }),
      ),
    ).toThrow(RangeError);
    expect(document).toEqual(snapshot);
  });
});

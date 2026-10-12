import { describe, expect, it } from "vitest";

import {
  applyDeleteRange,
  canDeleteRange,
  createDeleteRangeOperation,
  createDocument,
  createParagraph,
  createSelectionAfterDeleteRange,
  createTableCell,
  createTableRow,
  createText,
  validateDocument,
  type ParagraphNode,
  type RangeSelection,
} from "../../src";

function tableDocument(paragraphs: ParagraphNode[]) {
  return createDocument([
    {
      children: [
        createTableRow([
          createTableCell(paragraphs),
          createTableCell([createParagraph([createText("邻格")])]),
        ]),
      ],
      type: "table",
    },
    createParagraph([createText("表格后方")]),
  ]);
}

describe("delete range inside a table cell", () => {
  it.each(["forward", "backward"])(
    "merges boundary text and marks for a %s selection",
    (direction) => {
      const document = tableDocument([
        createParagraph([createText("前段")]),
        createParagraph([createText("开头", { bold: true })]),
        createParagraph([createText("删除中间段")]),
        createParagraph([createText("结尾", { italic: true })]),
        createParagraph([createText("后段")]),
      ]);
      const snapshot = structuredClone(document);
      const start = { path: [0, 0, 0, 1, 0], offset: 1 };
      const end = { path: [0, 0, 0, 3, 0], offset: 1 };
      const range: RangeSelection = {
        anchor: direction === "forward" ? start : end,
        focus: direction === "forward" ? end : start,
      };
      const operation = createDeleteRangeOperation(range);

      expect(canDeleteRange(document, range)).toBe(true);
      expect(applyDeleteRange(document, operation)).toEqual(
        tableDocument([
          createParagraph([createText("前段")]),
          createParagraph([
            createText("开", { bold: true }),
            createText("尾", { italic: true }),
          ]),
          createParagraph([createText("后段")]),
        ]),
      );
      expect(createSelectionAfterDeleteRange(document, operation)).toEqual({
        anchor: { path: [0, 0, 0, 1, 0], offset: 1 },
        focus: { path: [0, 0, 0, 1, 0], offset: 1 },
      });
      expect(document).toEqual(snapshot);
    },
  );

  it("keeps one editable empty paragraph after deleting all cell text", () => {
    const document = tableDocument([
      createParagraph([createText("第一段")]),
      createParagraph([createText("第二段")]),
    ]);
    const operation = createDeleteRangeOperation({
      anchor: { path: [0, 0, 0, 0, 0], offset: 0 },
      focus: { path: [0, 0, 0, 1, 0], offset: 3 },
    });
    const result = applyDeleteRange(document, operation);

    expect(result).toEqual(tableDocument([createParagraph()]));
    expect(validateDocument(result).valid).toBe(true);
    expect(createSelectionAfterDeleteRange(document, operation)).toEqual({
      anchor: { path: [0, 0, 0, 0, 0], offset: 0 },
      focus: { path: [0, 0, 0, 0, 0], offset: 0 },
    });
  });

  it("deletes a paragraph break without removing either boundary text", () => {
    const document = tableDocument([
      createParagraph([createText("前段")]),
      createParagraph([createText("后段")]),
    ]);
    const operation = createDeleteRangeOperation({
      anchor: { path: [0, 0, 0, 0, 0], offset: 2 },
      focus: { path: [0, 0, 0, 1, 0], offset: 0 },
    });

    expect(applyDeleteRange(document, operation)).toEqual(
      tableDocument([createParagraph([createText("前段后段")])]),
    );
    expect(createSelectionAfterDeleteRange(document, operation).anchor).toEqual({
      path: [0, 0, 0, 0, 0],
      offset: 2,
    });
  });

  it("preserves boundary text nodes and links outside the selected fragments", () => {
    const link = { href: "https://example.com/retained" };
    const document = tableDocument([
      createParagraph([createText("保", { bold: true }), createText("删除")]),
      createParagraph(),
      createParagraph([createText("剪掉"), createText("尾", { link })]),
    ]);
    const operation = createDeleteRangeOperation({
      anchor: { path: [0, 0, 0, 0, 1], offset: 0 },
      focus: { path: [0, 0, 0, 2, 0], offset: 2 },
    });

    expect(applyDeleteRange(document, operation)).toEqual(
      tableDocument([
        createParagraph([createText("保", { bold: true }), createText("尾", { link })]),
      ]),
    );
    expect(createSelectionAfterDeleteRange(document, operation).anchor).toEqual({
      path: [0, 0, 0, 0, 0],
      offset: 1,
    });
  });

  it.each([
    { name: "same paragraph", focus: { path: [0, 0, 0, 0, 0], offset: 1 } },
    { name: "another cell", focus: { path: [0, 0, 1, 0, 0], offset: 1 } },
    { name: "outside the table", focus: { path: [1, 0], offset: 1 } },
    { name: "missing paragraph", focus: { path: [0, 0, 0, 2, 0], offset: 1 } },
    { name: "invalid offset", focus: { path: [0, 0, 0, 1, 0], offset: 99 } },
  ])("rejects $name without mutating the document", ({ focus }) => {
    const document = tableDocument([
      createParagraph([createText("第一段")]),
      createParagraph([createText("第二段")]),
    ]);
    const snapshot = structuredClone(document);
    const range = { anchor: { path: [0, 0, 0, 0, 0], offset: 0 }, focus };
    const operation = createDeleteRangeOperation(range);

    expect(canDeleteRange(document, range)).toBe(false);
    expect(() => applyDeleteRange(document, operation)).toThrow(RangeError);
    expect(() => createSelectionAfterDeleteRange(document, operation)).toThrow(
      RangeError,
    );
    expect(document).toEqual(snapshot);
  });
});

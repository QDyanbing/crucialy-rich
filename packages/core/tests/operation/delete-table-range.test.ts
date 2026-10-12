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
});

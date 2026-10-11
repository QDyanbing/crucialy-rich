import { describe, expect, it } from "vitest";

import {
  applyTransaction,
  boldCommand,
  createDocument,
  createParagraph,
  createTableCell,
  createTableRow,
  createText,
  isTableNode,
} from "../../src";

function createMultiParagraphTable() {
  return createDocument([
    {
      children: [
        createTableRow([
          createTableCell([
            createParagraph([createText("第一段", { bold: true })]),
            createParagraph([createText("第二段")]),
          ]),
        ]),
      ],
      type: "table",
    },
  ]);
}

const forwardSelection = {
  anchor: { path: [0, 0, 0, 0, 0], offset: 0 },
  focus: { path: [0, 0, 0, 1, 0], offset: 3 },
};

describe("table paragraph formatting commands", () => {
  it("applies one boolean mark across paragraphs in the same cell", () => {
    const document = createMultiParagraphTable();
    const result = boldCommand.execute({
      context: { document, selection: forwardSelection },
    });

    expect(result.transaction?.operations).toHaveLength(2);
    expect(result.transaction?.operations).toEqual([
      expect.objectContaining({ active: true, type: "toggle_mark" }),
      expect.objectContaining({ active: true, type: "toggle_mark" }),
    ]);
    expect(result.selection).toEqual(forwardSelection);

    const table = applyTransaction(document, result.transaction!).children[0];

    if (!isTableNode(table)) {
      throw new Error("Expected a table result.");
    }

    expect(
      table.children[0]?.children[0]?.children.every((paragraph) =>
        paragraph.children.every((text) => text.marks?.bold === true),
      ),
    ).toBe(true);
  });
});

import { describe, expect, it } from "vitest";

import {
  applyTransaction,
  canExecutePasteCommand,
  createDocument,
  createParagraph,
  createTableCell,
  createTableRow,
  createText,
  parsePlainText,
  pasteCommand,
  type ParagraphNode,
} from "../../src";

function tableDocument(paragraphs: ParagraphNode[]) {
  return createDocument([
    {
      type: "table",
      children: [
        createTableRow([
          createTableCell(paragraphs),
          createTableCell([createParagraph([createText("邻格")])]),
        ]),
      ],
    },
  ]);
}

describe("paste over table cell text ranges", () => {
  it("maps the insertion point after removing marked text nodes", () => {
    const document = tableDocument([
      createParagraph([
        createText("保", { bold: true }),
        createText("删除", { italic: true }),
        createText("尾"),
      ]),
    ]);
    const result = pasteCommand.execute({
      context: {
        document,
        selection: {
          anchor: { path: [0, 0, 0, 0, 1], offset: 0 },
          focus: { path: [0, 0, 0, 0, 2], offset: 0 },
        },
      },
      payload: { fragment: parsePlainText("新")! },
    });

    expect(applyTransaction(document, result.transaction!)).toEqual(
      tableDocument([
        createParagraph([createText("保新", { bold: true }), createText("尾")]),
      ]),
    );
    expect(result.selection?.anchor).toEqual({ path: [0, 0, 0, 0, 0], offset: 2 });
  });

  it("replaces a cross-paragraph cell range with a valid delete_range transaction", () => {
    const document = tableDocument([
      createParagraph([createText("开头")]),
      createParagraph([createText("中间")]),
      createParagraph([createText("结尾")]),
    ]);
    const input = {
      context: {
        document,
        selection: {
          anchor: { path: [0, 0, 0, 0, 0], offset: 1 },
          focus: { path: [0, 0, 0, 2, 0], offset: 1 },
        },
      },
      payload: { fragment: parsePlainText("新")! },
    };
    const result = pasteCommand.execute(input);

    expect(canExecutePasteCommand(input)).toBe(true);
    expect(result.transaction?.operations.map((operation) => operation.type)).toEqual([
      "delete_range",
      "insert_text",
    ]);
    expect(applyTransaction(document, result.transaction!)).toEqual(
      tableDocument([createParagraph([createText("开新尾")])]),
    );
    expect(result.selection?.anchor).toEqual({ path: [0, 0, 0, 0, 0], offset: 2 });
  });
});

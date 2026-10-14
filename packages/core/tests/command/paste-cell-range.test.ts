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
        createTableRow([
          createTableCell([createParagraph([createText("下格")])]),
          createTableCell([createParagraph([createText("下邻格")])]),
        ]),
      ],
    },
  ]);
}

describe("paste over table cell text ranges", () => {
  describe.each(["forward", "backward"])("%s range", (direction) => {
    it.each(["甲\n乙", "甲\t乙\n丙\t丁"])(
      "replaces selected paragraphs with %j without filling adjacent cells",
      (text) => {
        const document = tableDocument([
          createParagraph([createText("开头")]),
          createParagraph([createText("结尾")]),
        ]);
        const start = { path: [0, 0, 0, 0, 0], offset: 1 };
        const end = { path: [0, 0, 0, 1, 0], offset: 1 };
        const result = pasteCommand.execute({
          context: {
            document,
            selection: {
              anchor: direction === "forward" ? start : end,
              focus: direction === "forward" ? end : start,
            },
          },
          payload: { fragment: parsePlainText(text)! },
        });
        const lines = text.split("\n");

        expect(
          result.transaction?.operations.map((operation) => operation.type),
        ).toEqual(["delete_range", "insert_text", "split_block", "insert_text"]);
        expect(applyTransaction(document, result.transaction!)).toEqual(
          tableDocument([
            createParagraph([createText(`开${lines[0]}`)]),
            createParagraph([createText(`${lines[1]}尾`)]),
          ]),
        );
        expect(result.selection?.anchor).toEqual({
          path: [0, 0, 0, 1, 0],
          offset: lines[1]!.length,
        });
      },
    );
  });

  it("keeps TSV inside a selected paragraph instead of replacing whole cells", () => {
    const document = tableDocument([createParagraph([createText("开旧尾")])]);
    const result = pasteCommand.execute({
      context: {
        document,
        selection: {
          anchor: { path: [0, 0, 0, 0, 0], offset: 1 },
          focus: { path: [0, 0, 0, 0, 0], offset: 2 },
        },
      },
      payload: { fragment: parsePlainText("甲\t乙")! },
    });

    expect(result.transaction?.operations.map((operation) => operation.type)).toEqual([
      "delete_text",
      "insert_text",
    ]);
    expect(applyTransaction(document, result.transaction!)).toEqual(
      tableDocument([createParagraph([createText("开甲\t乙尾")])]),
    );
  });

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

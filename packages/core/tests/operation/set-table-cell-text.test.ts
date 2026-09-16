import { describe, expect, it } from "vitest";

import {
  applySetTableCellText,
  applyTransaction,
  createDocument,
  createParagraph,
  createSetTableCellTextOperation,
  createTable,
  createText,
  createTransaction,
  isTableNode,
  validateDocument,
} from "../../src";

describe("set table cell text operation", () => {
  it("replaces all paragraphs in the target cell", () => {
    const table = createTable(1, 2);
    table.children[0]!.children[0]!.children = [
      createParagraph([createText("旧一")]),
      createParagraph([createText("旧二")]),
    ];
    const document = createDocument([table]);
    const result = applySetTableCellText(
      document,
      createSetTableCellTextOperation([0, 0, 0], "新内容"),
    );
    const resultTable = result.children[0];

    expect(isTableNode(resultTable)).toBe(true);

    if (!isTableNode(resultTable)) {
      throw new Error("expected table result");
    }

    expect(resultTable.children[0]?.children[0]?.children).toEqual([
      createParagraph([createText("新内容")]),
    ]);
    expect(table.children[0]!.children[0]!.children).toHaveLength(2);
    expect(validateDocument(result).valid).toBe(true);
  });

  it("clones its path inside a transaction", () => {
    const path = [0, 0, 0];
    const document = createDocument([createTable(1, 1)]);
    const transaction = createTransaction([
      createSetTableCellTextOperation(path, "内容"),
    ]);

    path[0] = 9;

    expect(transaction.operations[0]).toEqual({
      path: [0, 0, 0],
      text: "内容",
      type: "set_table_cell_text",
    });
    expect(validateDocument(applyTransaction(document, transaction)).valid).toBe(true);
  });

  it("rejects paths outside table cells", () => {
    expect(() =>
      applySetTableCellText(
        createDocument([createParagraph([createText("正文")])]),
        createSetTableCellTextOperation([0], "内容"),
      ),
    ).toThrow(RangeError);
  });
});

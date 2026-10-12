import { describe, expect, it } from "vitest";

import {
  applyTransaction,
  createDocument,
  createParagraph,
  createTableCell,
  createTableRow,
  createText,
  deleteSelectionCommand,
  insertTextCommand,
  splitBlockCommand,
  validateDocument,
  type RangeSelection,
} from "../../src";

function tableDocument(texts: string[]) {
  return createDocument([
    {
      children: [
        createTableRow([
          createTableCell(texts.map((text) => createParagraph([createText(text)]))),
          createTableCell([createParagraph([createText("邻格")])]),
        ]),
      ],
      type: "table",
    },
  ]);
}

const selection: RangeSelection = {
  anchor: { path: [0, 0, 0, 0, 0], offset: 1 },
  focus: { path: [0, 0, 0, 2, 0], offset: 1 },
};

describe("table cell range editing commands", () => {
  it("deletes a backward selection across three paragraphs in one transaction", () => {
    const document = tableDocument(["开头", "中间", "结尾"]);
    const result = deleteSelectionCommand.execute({
      context: {
        document,
        selection: { anchor: selection.focus, focus: selection.anchor },
      },
    });

    expect(result.status).toBe("success");
    expect(result.transaction?.operations.map((operation) => operation.type)).toEqual([
      "delete_range",
    ]);
    expect(applyTransaction(document, result.transaction!)).toEqual(
      tableDocument(["开尾"]),
    );
    expect(result.selection).toEqual({
      anchor: selection.anchor,
      focus: selection.anchor,
    });
  });

  it("replaces selected paragraphs and supports typing at the remapped caret", () => {
    const document = tableDocument(["开头", "中间", "结尾"]);
    const replacement = insertTextCommand.execute({
      context: { document, selection },
      payload: { text: "新" },
    });

    expect(
      replacement.transaction?.operations.map((operation) => operation.type),
    ).toEqual(["delete_range", "insert_text"]);
    const replaced = applyTransaction(document, replacement.transaction!);
    expect(replaced).toEqual(tableDocument(["开新尾"]));
    expect(replacement.selection?.anchor).toEqual({
      path: [0, 0, 0, 0, 0],
      offset: 2,
    });

    if (!replacement.selection) {
      throw new Error("Replacement must return a caret.");
    }
    const continued = insertTextCommand.execute({
      context: { document: replaced, selection: replacement.selection },
      payload: { text: "续" },
    });
    expect(applyTransaction(replaced, continued.transaction!)).toEqual(
      tableDocument(["开新续尾"]),
    );
  });

  it("replaces the range with a paragraph break without splitting the cell", () => {
    const document = tableDocument(["开头", "中间", "结尾"]);
    const result = splitBlockCommand.execute({ context: { document, selection } });
    const next = applyTransaction(document, result.transaction!);

    expect(result.transaction?.operations.map((operation) => operation.type)).toEqual([
      "delete_range",
      "split_block",
    ]);
    expect(next).toEqual(tableDocument(["开", "尾"]));
    expect(validateDocument(next).valid).toBe(true);
    expect(result.selection).toEqual({
      anchor: { path: [0, 0, 0, 1, 0], offset: 0 },
      focus: { path: [0, 0, 0, 1, 0], offset: 0 },
    });
  });

  it.each([deleteSelectionCommand, insertTextCommand, splitBlockCommand])(
    "skips $name across cells without returning a transaction",
    (command) => {
      const result = command.execute({
        context: {
          document: tableDocument(["开头", "结尾"]),
          selection: {
            anchor: selection.anchor,
            focus: { path: [0, 0, 1, 0, 0], offset: 1 },
          },
        },
        payload: { text: "不应插入" },
      });

      expect(result.status).toBe("skipped");
      expect(result.transaction).toBeUndefined();
    },
  );
});

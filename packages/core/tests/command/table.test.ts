import { describe, expect, it } from "vitest";

import {
  addColumnAfterCommand,
  addColumnBeforeCommand,
  applyTransaction,
  addRowAfterCommand,
  addRowBeforeCommand,
  canExecuteInsertTableCommand,
  canExecuteDeleteTableCommand,
  createDocument,
  createParagraph,
  createText,
  createTable,
  deleteRowCommand,
  deleteColumnCommand,
  deleteTableCommand,
  insertTableCommand,
  validateDocument,
} from "../../src";

describe("insertTableCommand", () => {
  it("splits a text block around a default three-by-three table", () => {
    const document = createDocument([createParagraph([createText("上下")])]);
    const input = {
      context: {
        document,
        selection: {
          anchor: { offset: 1, path: [0, 0] },
          focus: { offset: 1, path: [0, 0] },
        },
      },
    };
    const result = insertTableCommand.execute(input);
    const nextDocument = applyTransaction(document, result.transaction!);
    const table = nextDocument.children[1];

    expect(canExecuteInsertTableCommand(input)).toBe(true);
    expect(result).toMatchObject({
      commandName: "insertTable",
      selection: {
        anchor: { offset: 0, path: [2, 0] },
        focus: { offset: 0, path: [2, 0] },
      },
      status: "success",
    });
    expect(table?.type).toBe("table");
    expect(
      table?.type === "table"
        ? table.children.map((row) => row.children.length)
        : undefined,
    ).toEqual([3, 3, 3]);
    expect(validateDocument(nextDocument).valid).toBe(true);
  });

  it("skips missing and expanded selections", () => {
    const document = createDocument();

    expect(insertTableCommand.execute({ context: { document } }).status).toBe(
      "skipped",
    );
    expect(
      canExecuteInsertTableCommand({
        context: {
          document,
          selection: {
            anchor: { offset: 0, path: [0, 0] },
            focus: { offset: 1, path: [0, 0] },
          },
        },
      }),
    ).toBe(false);
  });
});

describe("deleteTableCommand", () => {
  it("deletes a table and moves selection to following text", () => {
    const document = createDocument([
      createParagraph([createText("上")]),
      createTable(),
      createParagraph([createText("下")]),
    ]);
    const input = { context: { document }, payload: { path: [1] } };
    const result = deleteTableCommand.execute(input);

    expect(canExecuteDeleteTableCommand(input)).toBe(true);
    expect(result.selection).toEqual({
      anchor: { offset: 0, path: [1, 0] },
      focus: { offset: 0, path: [1, 0] },
    });
    expect(applyTransaction(document, result.transaction!).children).toEqual([
      createParagraph([createText("上")]),
      createParagraph([createText("下")]),
    ]);
  });

  it("restores an editable paragraph after deleting the only table", () => {
    const document = createDocument([createTable()]);
    const result = deleteTableCommand.execute({
      context: { document },
      payload: { path: [0] },
    });

    expect(applyTransaction(document, result.transaction!)).toEqual(createDocument());
    expect(result.selection?.anchor).toEqual({ offset: 0, path: [0, 0] });
  });

  it("skips non-table and malformed paths", () => {
    const document = createDocument();

    expect(
      canExecuteDeleteTableCommand({
        context: { document },
        payload: { path: [0] },
      }),
    ).toBe(false);
    expect(
      deleteTableCommand.execute({ context: { document }, payload: { path: [0, 0] } })
        .status,
    ).toBe("skipped");
  });
});

describe("table row insertion commands", () => {
  it("adds a row before the first row", () => {
    const table = createTable(2, 2);
    table.children[0]!.children[0]!.children[0]!.children[0]!.text = "首行";
    const document = createDocument([table]);
    const result = addRowBeforeCommand.execute({
      context: { document },
      payload: { path: [0], rowIndex: 0 },
    });
    const nextDocument = applyTransaction(document, result.transaction!);
    const nextTable = nextDocument.children[0];

    expect(nextTable?.type).toBe("table");
    expect(nextTable?.type === "table" ? nextTable.children.length : 0).toBe(3);
    expect(
      nextTable?.type === "table"
        ? nextTable.children[1]?.children[0]?.children[0]?.children[0]?.text
        : undefined,
    ).toBe("首行");
    expect(validateDocument(nextDocument).valid).toBe(true);
  });

  it("adds a row after the last row", () => {
    const document = createDocument([createTable(2, 3)]);
    const result = addRowAfterCommand.execute({
      context: { document },
      payload: { path: [0], rowIndex: 1 },
    });
    const nextTable = applyTransaction(document, result.transaction!).children[0];

    expect(nextTable?.type === "table" ? nextTable.children.length : 0).toBe(3);
    expect(
      nextTable?.type === "table" ? nextTable.children[2]?.children.length : undefined,
    ).toBe(3);
  });

  it("skips row indexes outside the table", () => {
    const document = createDocument([createTable(1, 1)]);

    expect(
      addRowBeforeCommand.execute({
        context: { document },
        payload: { path: [0], rowIndex: 1 },
      }).status,
    ).toBe("skipped");
  });
});

describe("deleteRowCommand", () => {
  it("deletes the selected row and keeps the table rectangular", () => {
    const table = createTable(2, 2);
    table.children[1]!.children[0]!.children[0]!.children[0]!.text = "保留";
    const document = createDocument([table]);
    const result = deleteRowCommand.execute({
      context: { document },
      payload: { path: [0], rowIndex: 0 },
    });
    const nextDocument = applyTransaction(document, result.transaction!);
    const nextTable = nextDocument.children[0];

    expect(nextTable?.type === "table" ? nextTable.children.length : 0).toBe(1);
    expect(
      nextTable?.type === "table"
        ? nextTable.children[0]?.children[0]?.children[0]?.children[0]?.text
        : undefined,
    ).toBe("保留");
    expect(validateDocument(nextDocument).valid).toBe(true);
  });

  it("removes the table when deleting its last row", () => {
    const document = createDocument([createTable(1, 2)]);
    const result = deleteRowCommand.execute({
      context: { document },
      payload: { path: [0], rowIndex: 0 },
    });

    expect(applyTransaction(document, result.transaction!)).toEqual(createDocument());
    expect(result.selection?.anchor).toEqual({ offset: 0, path: [0, 0] });
  });
});

describe("table column insertion commands", () => {
  it("adds a column before the first column in every row", () => {
    const table = createTable(2, 2);
    table.children[0]!.children[0]!.children[0]!.children[0]!.text = "原首列";
    const document = createDocument([table]);
    const result = addColumnBeforeCommand.execute({
      context: { document },
      payload: { columnIndex: 0, path: [0] },
    });
    const nextDocument = applyTransaction(document, result.transaction!);
    const nextTable = nextDocument.children[0];

    expect(
      nextTable?.type === "table"
        ? nextTable.children.map((row) => row.children.length)
        : undefined,
    ).toEqual([3, 3]);
    expect(
      nextTable?.type === "table"
        ? nextTable.children[0]?.children[1]?.children[0]?.children[0]?.text
        : undefined,
    ).toBe("原首列");
    expect(validateDocument(nextDocument).valid).toBe(true);
  });

  it("adds a column after the last column", () => {
    const document = createDocument([createTable(2, 2)]);
    const result = addColumnAfterCommand.execute({
      context: { document },
      payload: { columnIndex: 1, path: [0] },
    });
    const nextTable = applyTransaction(document, result.transaction!).children[0];

    expect(
      nextTable?.type === "table"
        ? nextTable.children.map((row) => row.children.length)
        : undefined,
    ).toEqual([3, 3]);
  });
});

describe("deleteColumnCommand", () => {
  it("deletes the selected column from every row", () => {
    const table = createTable(2, 2);
    table.children[0]!.children[1]!.children[0]!.children[0]!.text = "保留";
    const document = createDocument([table]);
    const result = deleteColumnCommand.execute({
      context: { document },
      payload: { columnIndex: 0, path: [0] },
    });
    const nextDocument = applyTransaction(document, result.transaction!);
    const nextTable = nextDocument.children[0];

    expect(
      nextTable?.type === "table"
        ? nextTable.children.map((row) => row.children.length)
        : undefined,
    ).toEqual([1, 1]);
    expect(
      nextTable?.type === "table"
        ? nextTable.children[0]?.children[0]?.children[0]?.children[0]?.text
        : undefined,
    ).toBe("保留");
    expect(validateDocument(nextDocument).valid).toBe(true);
  });

  it("removes the table when deleting its last column", () => {
    const document = createDocument([createTable(2, 1)]);
    const result = deleteColumnCommand.execute({
      context: { document },
      payload: { columnIndex: 0, path: [0] },
    });

    expect(applyTransaction(document, result.transaction!)).toEqual(createDocument());
    expect(result.selection?.anchor).toEqual({ offset: 0, path: [0, 0] });
  });
});

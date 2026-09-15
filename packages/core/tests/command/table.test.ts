import { describe, expect, it } from "vitest";

import {
  applyTransaction,
  canExecuteInsertTableCommand,
  canExecuteDeleteTableCommand,
  createDocument,
  createParagraph,
  createText,
  createTable,
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

import { describe, expect, it } from "vitest";

import {
  applyTransaction,
  canExecuteInsertTableCommand,
  createDocument,
  createParagraph,
  createText,
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

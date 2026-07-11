import { describe, expect, it } from "vitest";

import {
  applyTransaction,
  canExecuteInsertTextCommand,
  createDocument,
  createParagraph,
  createText,
  insertTextCommand,
} from "../../src";

describe("insertTextCommand", () => {
  it("inserts text into a collapsed selection", () => {
    const document = createDocument([createParagraph([createText("你好")])]);
    const input = {
      context: {
        document,
        selection: {
          anchor: { path: [0, 0], offset: 2 },
          focus: { path: [0, 0], offset: 2 },
        },
      },
      payload: { text: "世界" },
    };
    const result = insertTextCommand.execute(input);

    expect(canExecuteInsertTextCommand(input)).toBe(true);
    expect(result).toMatchObject({
      commandName: "insertText",
      ok: true,
      selection: {
        anchor: { path: [0, 0], offset: 4 },
        focus: { path: [0, 0], offset: 4 },
      },
      status: "success",
    });
    expect(result.transaction).toEqual({
      operations: [
        {
          point: { path: [0, 0], offset: 2 },
          text: "世界",
          type: "insert_text",
        },
      ],
    });

    expect(
      applyTransaction(document, result.transaction!).children[0]?.children[0]?.text,
    ).toBe("你好世界");
  });
});

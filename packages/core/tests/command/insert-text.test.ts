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

  it("replaces a text range before inserting text", () => {
    const document = createDocument([createParagraph([createText("你好旧内容")])]);
    const result = insertTextCommand.execute({
      context: {
        document,
        selection: {
          anchor: { path: [0, 0], offset: 2 },
          focus: { path: [0, 0], offset: 5 },
        },
      },
      payload: { text: "新" },
    });

    expect(result.transaction).toEqual({
      operations: [
        {
          range: {
            anchor: { path: [0, 0], offset: 2 },
            focus: { path: [0, 0], offset: 5 },
          },
          type: "delete_text",
        },
        {
          point: { path: [0, 0], offset: 2 },
          text: "新",
          type: "insert_text",
        },
      ],
    });
    expect(result.selection).toEqual({
      anchor: { path: [0, 0], offset: 3 },
      focus: { path: [0, 0], offset: 3 },
    });
    expect(
      applyTransaction(document, result.transaction!).children[0]?.children[0]?.text,
    ).toBe("你好新容");
  });

  it("normalizes a reversed range before replacing text", () => {
    const document = createDocument([createParagraph([createText("你好旧内容")])]);
    const result = insertTextCommand.execute({
      context: {
        document,
        selection: {
          anchor: { path: [0, 0], offset: 5 },
          focus: { path: [0, 0], offset: 2 },
        },
      },
      payload: { text: "新" },
    });

    expect(result.transaction?.operations[0]).toMatchObject({
      range: {
        anchor: { path: [0, 0], offset: 2 },
        focus: { path: [0, 0], offset: 5 },
      },
      type: "delete_text",
    });
    expect(result.selection).toEqual({
      anchor: { path: [0, 0], offset: 3 },
      focus: { path: [0, 0], offset: 3 },
    });
  });
});

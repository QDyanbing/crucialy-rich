import { describe, expect, it } from "vitest";

import {
  applyTransaction,
  canExecuteInlineCodeCommand,
  createDocument,
  createParagraph,
  createText,
  inlineCodeCommand,
  insertTextCommand,
  isInlineCodeCommandActive,
} from "../../src";

describe("inlineCodeCommand", () => {
  it("applies inline code to a selected text range", () => {
    const document = createDocument([
      createParagraph([createText("执行代码", { bold: true })]),
    ]);
    const input = {
      context: {
        document,
        selection: {
          anchor: { offset: 2, path: [0, 0] },
          focus: { offset: 4, path: [0, 0] },
        },
      },
    };
    const result = inlineCodeCommand.execute(input);

    expect(canExecuteInlineCodeCommand(input)).toBe(true);
    expect(result.transaction?.operations).toEqual([
      {
        mark: "code",
        range: input.context.selection,
        type: "toggle_mark",
      },
    ]);
    expect(
      applyTransaction(document, result.transaction!).children[0]?.children,
    ).toEqual([
      { marks: { bold: true }, text: "执行", type: "text" },
      {
        marks: { bold: true, code: true },
        text: "代码",
        type: "text",
      },
    ]);
  });

  it("removes inline code without changing other marks", () => {
    const document = createDocument([
      createParagraph([createText("代码", { bold: true, code: true, italic: true })]),
    ]);
    const input = {
      context: {
        document,
        selection: {
          anchor: { offset: 0, path: [0, 0] },
          focus: { offset: 2, path: [0, 0] },
        },
      },
    };
    const result = inlineCodeCommand.execute(input);

    expect(isInlineCodeCommandActive(input)).toBe(true);
    expect(
      applyTransaction(document, result.transaction!).children[0]?.children[0],
    ).toEqual({
      marks: { bold: true, italic: true },
      text: "代码",
      type: "text",
    });
  });

  it("uses collapsed inline code placeholders for later text input", () => {
    const document = createDocument([createParagraph([createText("前后")])]);
    const codeResult = inlineCodeCommand.execute({
      context: {
        document,
        selection: {
          anchor: { offset: 1, path: [0, 0] },
          focus: { offset: 1, path: [0, 0] },
        },
      },
    });
    const codeDocument = applyTransaction(document, codeResult.transaction!);

    if (!codeResult.selection) {
      throw new Error("Inline code command should return a selection.");
    }

    const insertResult = insertTextCommand.execute({
      context: { document: codeDocument, selection: codeResult.selection },
      payload: { text: "码" },
    });

    expect(
      applyTransaction(codeDocument, insertResult.transaction!).children[0]?.children,
    ).toEqual([
      { text: "前", type: "text" },
      { marks: { code: true }, text: "码", type: "text" },
      { text: "后", type: "text" },
    ]);
  });
});

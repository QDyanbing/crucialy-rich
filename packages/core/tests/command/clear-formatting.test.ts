import { describe, expect, it } from "vitest";

import {
  applyTransaction,
  canExecuteClearFormattingCommand,
  CLEAR_FORMATTING_COMMAND_NAME,
  clearFormattingCommand,
  createDocument,
  createParagraph,
  createText,
} from "../../src";

describe("clearFormattingCommand", () => {
  it("clears all formatting from a selected text fragment", () => {
    const document = createDocument([
      createParagraph([
        createText("富文本编辑", {
          backgroundColor: "#fff2e8",
          bold: true,
          code: true,
          fontSize: 20,
          italic: true,
          link: { href: "https://example.com/" },
          strike: true,
          textColor: "#1677ff",
          underline: true,
        }),
      ]),
    ]);
    const input = {
      context: {
        document,
        selection: {
          anchor: { path: [0, 0], offset: 1 },
          focus: { path: [0, 0], offset: 3 },
        },
      },
    };
    const result = clearFormattingCommand.execute(input);

    expect(canExecuteClearFormattingCommand(input)).toBe(true);
    expect(result).toMatchObject({
      commandName: CLEAR_FORMATTING_COMMAND_NAME,
      ok: true,
      status: "success",
    });
    expect(result.transaction?.operations).toEqual([
      {
        range: input.context.selection,
        type: "clear_marks",
      },
    ]);
    expect(
      applyTransaction(document, result.transaction!).children[0]?.children,
    ).toEqual([
      expect.objectContaining({ text: "富" }),
      { text: "文本", type: "text" },
      expect.objectContaining({ text: "编辑" }),
    ]);
    expect(result.selection).toEqual({
      anchor: { path: [0, 1], offset: 0 },
      focus: { path: [0, 1], offset: 2 },
    });
  });

  it("clears the typing style at a collapsed selection", () => {
    const document = createDocument([
      createParagraph([createText("样式文字", { bold: true, fontSize: 18 })]),
    ]);
    const result = clearFormattingCommand.execute({
      context: {
        document,
        selection: {
          anchor: { path: [0, 0], offset: 2 },
          focus: { path: [0, 0], offset: 2 },
        },
      },
    });

    expect(result.ok).toBe(true);
    expect(result.selection).toEqual({
      anchor: { path: [0, 1], offset: 0 },
      focus: { path: [0, 1], offset: 0 },
    });
  });

  it("skips without a selection", () => {
    const input = {
      context: {
        document: createDocument([createParagraph([createText("正文")])]),
      },
    };

    expect(canExecuteClearFormattingCommand(input)).toBe(false);
    expect(clearFormattingCommand.execute(input)).toMatchObject({
      commandName: CLEAR_FORMATTING_COMMAND_NAME,
      ok: false,
      status: "skipped",
    });
  });
});

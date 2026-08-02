import { describe, expect, it } from "vitest";

import {
  applyTransaction,
  canExecuteStrikeCommand,
  createDocument,
  createParagraph,
  createText,
  insertTextCommand,
  strikeCommand,
} from "../../src";

describe("strikeCommand", () => {
  it("applies strike to a selected text range", () => {
    const document = createDocument([
      createParagraph([createText("你好世界", { underline: true })]),
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
    const result = strikeCommand.execute(input);

    expect(canExecuteStrikeCommand(input)).toBe(true);
    expect(result.ok).toBe(true);
    expect(result.transaction?.operations).toEqual([
      {
        mark: "strike",
        range: {
          anchor: { path: [0, 0], offset: 1 },
          focus: { path: [0, 0], offset: 3 },
        },
        type: "toggle_mark",
      },
    ]);
    expect(
      applyTransaction(document, result.transaction!).children[0]?.children,
    ).toEqual([
      { type: "text", text: "你", marks: { underline: true } },
      {
        type: "text",
        text: "好世",
        marks: { strike: true, underline: true },
      },
      { type: "text", text: "界", marks: { underline: true } },
    ]);
  });

  it("removes strike without changing other marks", () => {
    const document = createDocument([
      createParagraph([
        createText("你好", {
          bold: true,
          strike: true,
          underline: true,
        }),
      ]),
    ]);
    const result = strikeCommand.execute({
      context: {
        document,
        selection: {
          anchor: { path: [0, 0], offset: 0 },
          focus: { path: [0, 0], offset: 2 },
        },
      },
    });

    expect(
      applyTransaction(document, result.transaction!).children[0]?.children[0],
    ).toEqual({
      type: "text",
      text: "你好",
      marks: { bold: true, underline: true },
    });
  });

  it("uses collapsed strike placeholders for later text input", () => {
    const document = createDocument([createParagraph([createText("你好世界")])]);
    const strikeResult = strikeCommand.execute({
      context: {
        document,
        selection: {
          anchor: { path: [0, 0], offset: 2 },
          focus: { path: [0, 0], offset: 2 },
        },
      },
    });
    const strikeDocument = applyTransaction(document, strikeResult.transaction!);

    if (!strikeResult.selection) {
      throw new Error("Strike command should return a selection.");
    }

    const insertResult = insertTextCommand.execute({
      context: {
        document: strikeDocument,
        selection: strikeResult.selection,
      },
      payload: { text: "删" },
    });

    expect(
      applyTransaction(strikeDocument, insertResult.transaction!).children[0]?.children,
    ).toEqual([
      { type: "text", text: "你好" },
      { type: "text", text: "删", marks: { strike: true } },
      { type: "text", text: "世界" },
    ]);
  });
});

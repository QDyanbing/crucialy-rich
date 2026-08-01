import { describe, expect, it } from "vitest";

import {
  applyTransaction,
  canExecuteUnderlineCommand,
  createDocument,
  createParagraph,
  createText,
  insertTextCommand,
  isUnderlineCommandActive,
  underlineCommand,
} from "../../src";

describe("underlineCommand", () => {
  it("applies underline to a selected text range", () => {
    const document = createDocument([
      createParagraph([createText("你好世界", { bold: true })]),
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
    const result = underlineCommand.execute(input);

    expect(canExecuteUnderlineCommand(input)).toBe(true);
    expect(result.ok).toBe(true);
    expect(result.transaction?.operations).toEqual([
      {
        mark: "underline",
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
      { type: "text", text: "你", marks: { bold: true } },
      {
        type: "text",
        text: "好世",
        marks: { bold: true, underline: true },
      },
      { type: "text", text: "界", marks: { bold: true } },
    ]);
  });

  it("removes underline without changing other marks", () => {
    const document = createDocument([
      createParagraph([
        createText("你好", {
          bold: true,
          underline: true,
        }),
      ]),
    ]);
    const result = underlineCommand.execute({
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
      marks: { bold: true },
    });
  });

  it("uses collapsed underline placeholders for later text input", () => {
    const document = createDocument([createParagraph([createText("你好世界")])]);
    const underlineResult = underlineCommand.execute({
      context: {
        document,
        selection: {
          anchor: { path: [0, 0], offset: 2 },
          focus: { path: [0, 0], offset: 2 },
        },
      },
    });
    const underlineDocument = applyTransaction(document, underlineResult.transaction!);

    if (!underlineResult.selection) {
      throw new Error("Underline command should return a selection.");
    }

    const insertResult = insertTextCommand.execute({
      context: {
        document: underlineDocument,
        selection: underlineResult.selection,
      },
      payload: { text: "线" },
    });

    expect(
      applyTransaction(underlineDocument, insertResult.transaction!).children[0]
        ?.children,
    ).toEqual([
      { type: "text", text: "你好" },
      { type: "text", text: "线", marks: { underline: true } },
      { type: "text", text: "世界" },
    ]);
  });

  it("reads active state and toggles underline across text nodes", () => {
    const document = createDocument([
      createParagraph([
        createText("你"),
        createText("好", { bold: true, underline: true }),
        createText("世界", { bold: true, underline: true }),
      ]),
    ]);
    const input = {
      context: {
        document,
        selection: {
          anchor: { path: [0, 1], offset: 0 },
          focus: { path: [0, 2], offset: 1 },
        },
      },
    };

    expect(isUnderlineCommandActive(input)).toBe(true);

    const result = underlineCommand.execute(input);

    expect(result.selection).toEqual({
      anchor: { path: [0, 1], offset: 0 },
      focus: { path: [0, 1], offset: 2 },
    });
    expect(
      applyTransaction(document, result.transaction!).children[0]?.children,
    ).toEqual([
      { type: "text", text: "你" },
      { type: "text", text: "好世", marks: { bold: true } },
      {
        type: "text",
        text: "界",
        marks: { bold: true, underline: true },
      },
    ]);
  });
});

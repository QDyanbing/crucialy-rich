import { describe, expect, it } from "vitest";

import {
  applyTransaction,
  canExecuteSetFontSizeCommand,
  createDocument,
  createParagraph,
  createText,
  insertTextCommand,
  setFontSizeCommand,
} from "../../src";

describe("setFontSizeCommand", () => {
  it("sets a supported font size on a selected range", () => {
    const document = createDocument([createParagraph([createText("你好世界")])]);
    const input = {
      context: {
        document,
        selection: {
          anchor: { path: [0, 0], offset: 1 },
          focus: { path: [0, 0], offset: 3 },
        },
      },
      payload: { fontSize: 18 },
    };
    const result = setFontSizeCommand.execute(input);

    expect(canExecuteSetFontSizeCommand(input)).toBe(true);
    expect(result.ok).toBe(true);
    expect(result.transaction?.operations).toEqual([
      {
        attribute: "fontSize",
        range: {
          anchor: { path: [0, 0], offset: 1 },
          focus: { path: [0, 0], offset: 3 },
        },
        type: "set_mark_attribute",
        value: 18,
      },
    ]);
    expect(
      applyTransaction(document, result.transaction!).children[0]?.children,
    ).toEqual([
      { text: "你", type: "text" },
      { marks: { fontSize: 18 }, text: "好世", type: "text" },
      { text: "界", type: "text" },
    ]);
    expect(result.selection).toEqual({
      anchor: { path: [0, 1], offset: 0 },
      focus: { path: [0, 1], offset: 2 },
    });
  });

  it("sets a font size across sibling text nodes", () => {
    const document = createDocument([
      createParagraph([
        createText("你"),
        createText("好", { bold: true }),
        createText("世界"),
      ]),
    ]);
    const result = setFontSizeCommand.execute({
      context: {
        document,
        selection: {
          anchor: { path: [0, 2], offset: 1 },
          focus: { path: [0, 0], offset: 0 },
        },
      },
      payload: { fontSize: 24 },
    });

    expect(
      applyTransaction(document, result.transaction!).children[0]?.children,
    ).toEqual([
      { marks: { fontSize: 24 }, text: "你", type: "text" },
      { marks: { bold: true, fontSize: 24 }, text: "好", type: "text" },
      { marks: { fontSize: 24 }, text: "世", type: "text" },
      { text: "界", type: "text" },
    ]);
    expect(result.selection).toEqual({
      anchor: { path: [0, 0], offset: 0 },
      focus: { path: [0, 2], offset: 1 },
    });
  });

  it("uses a collapsed sized placeholder for later input", () => {
    const document = createDocument([createParagraph([createText("你好世界")])]);
    const sizeResult = setFontSizeCommand.execute({
      context: {
        document,
        selection: {
          anchor: { path: [0, 0], offset: 2 },
          focus: { path: [0, 0], offset: 2 },
        },
      },
      payload: { fontSize: 18 },
    });
    const sizedDocument = applyTransaction(document, sizeResult.transaction!);

    if (!sizeResult.selection) {
      throw new Error("Set font size command should return a selection.");
    }

    const insertResult = insertTextCommand.execute({
      context: {
        document: sizedDocument,
        selection: sizeResult.selection,
      },
      payload: { text: "大" },
    });

    expect(
      applyTransaction(sizedDocument, insertResult.transaction!).children[0]?.children,
    ).toEqual([
      { text: "你好", type: "text" },
      { marks: { fontSize: 18 }, text: "大", type: "text" },
      { text: "世界", type: "text" },
    ]);
  });
});

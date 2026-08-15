import { describe, expect, it } from "vitest";

import {
  applyTransaction,
  boldCommand,
  createDocument,
  createParagraph,
  createText,
  setFontSizeCommand,
  setTextColorCommand,
  validateDocument,
} from "../../src";

describe("text style command interaction", () => {
  it("combines font size, text color, and boolean marks", () => {
    const document = createDocument([createParagraph([createText("组合格式")])]);
    const selection = {
      anchor: { path: [0, 0], offset: 0 },
      focus: { path: [0, 0], offset: 4 },
    };
    const sizeResult = setFontSizeCommand.execute({
      context: { document, selection },
      payload: { fontSize: 24 },
    });
    const sizedDocument = applyTransaction(document, sizeResult.transaction!);

    if (!sizeResult.selection) {
      throw new Error("Set font size command should return a selection.");
    }

    const colorResult = setTextColorCommand.execute({
      context: { document: sizedDocument, selection: sizeResult.selection },
      payload: { textColor: "#0AF" },
    });
    const coloredDocument = applyTransaction(sizedDocument, colorResult.transaction!);

    if (!colorResult.selection) {
      throw new Error("Set text color command should return a selection.");
    }

    const boldResult = boldCommand.execute({
      context: { document: coloredDocument, selection: colorResult.selection },
    });
    const styledDocument = applyTransaction(coloredDocument, boldResult.transaction!);

    expect(styledDocument.children[0]?.children).toEqual([
      {
        marks: { bold: true, fontSize: 24, textColor: "#00aaff" },
        text: "组合格式",
        type: "text",
      },
    ]);
    expect(validateDocument(styledDocument)).toEqual({ errors: [], valid: true });
  });

  it("cancels attributes independently without removing boolean marks", () => {
    const document = createDocument([
      createParagraph([
        createText("保留格式", {
          bold: true,
          italic: true,
          fontSize: 24,
          textColor: "#1677ff",
        }),
      ]),
    ]);
    const selection = {
      anchor: { path: [0, 0], offset: 0 },
      focus: { path: [0, 0], offset: 4 },
    };
    const colorResult = setTextColorCommand.execute({
      context: { document, selection },
      payload: { textColor: null },
    });
    const colorlessDocument = applyTransaction(document, colorResult.transaction!);

    if (!colorResult.selection) {
      throw new Error("Set text color command should return a selection.");
    }

    expect(colorlessDocument.children[0]?.children[0]?.marks).toEqual({
      bold: true,
      fontSize: 24,
      italic: true,
    });

    const sizeResult = setFontSizeCommand.execute({
      context: {
        document: colorlessDocument,
        selection: colorResult.selection,
      },
      payload: { fontSize: null },
    });

    expect(
      applyTransaction(colorlessDocument, sizeResult.transaction!).children[0]
        ?.children[0]?.marks,
    ).toEqual({ bold: true, italic: true });
  });
});

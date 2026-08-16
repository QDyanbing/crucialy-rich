import { describe, expect, it } from "vitest";

import {
  applyTransaction,
  boldCommand,
  createDocument,
  createParagraph,
  createText,
  setBackgroundColorCommand,
  setFontSizeCommand,
  setTextColorCommand,
  validateDocument,
} from "../../src";

describe("text style command interaction", () => {
  it("combines font size, foreground, background, and boolean marks", () => {
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

    const backgroundResult = setBackgroundColorCommand.execute({
      context: {
        document: coloredDocument,
        selection: colorResult.selection,
      },
      payload: { backgroundColor: "#FC0" },
    });
    const highlightedDocument = applyTransaction(
      coloredDocument,
      backgroundResult.transaction!,
    );

    if (!backgroundResult.selection) {
      throw new Error("Set background color command should return a selection.");
    }

    const boldResult = boldCommand.execute({
      context: {
        document: highlightedDocument,
        selection: backgroundResult.selection,
      },
    });
    const styledDocument = applyTransaction(
      highlightedDocument,
      boldResult.transaction!,
    );

    expect(styledDocument.children[0]?.children).toEqual([
      {
        marks: {
          backgroundColor: "#ffcc00",
          bold: true,
          fontSize: 24,
          textColor: "#00aaff",
        },
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
          backgroundColor: "#fff4cc",
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
    const backgroundResult = setBackgroundColorCommand.execute({
      context: { document, selection },
      payload: { backgroundColor: null },
    });
    const backgroundlessDocument = applyTransaction(
      document,
      backgroundResult.transaction!,
    );

    if (!backgroundResult.selection) {
      throw new Error("Set background color command should return a selection.");
    }

    expect(backgroundlessDocument.children[0]?.children[0]?.marks).toEqual({
      bold: true,
      fontSize: 24,
      italic: true,
      textColor: "#1677ff",
    });

    const colorResult = setTextColorCommand.execute({
      context: {
        document: backgroundlessDocument,
        selection: backgroundResult.selection,
      },
      payload: { textColor: null },
    });
    const colorlessDocument = applyTransaction(
      backgroundlessDocument,
      colorResult.transaction!,
    );

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

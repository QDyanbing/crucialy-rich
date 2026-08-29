import { describe, expect, it } from "vitest";

import {
  applyTransaction,
  createDocument,
  createHeading,
  createParagraph,
  createQuote,
  createText,
  setHeadingCommand,
  toggleQuoteCommand,
  validateDocument,
} from "../../src";

describe("block type command interaction", () => {
  it("keeps content and selection through consecutive multi-block changes", () => {
    const document = createDocument([
      createParagraph([createText("第一段", { bold: true })]),
      createHeading(2, [createText("第二段", { italic: true })]),
      createQuote([createText("第三段", { underline: true })]),
    ]);
    const selection = {
      anchor: { path: [0, 0], offset: 1 },
      focus: { path: [2, 0], offset: 2 },
    };
    const headingResult = setHeadingCommand.execute({
      context: { document, selection },
      payload: { level: 4 },
    });
    const headingDocument = applyTransaction(document, headingResult.transaction!);

    if (!headingResult.selection) {
      throw new Error("Set heading command should return a selection.");
    }

    const quoteResult = toggleQuoteCommand.execute({
      context: { document: headingDocument, selection: headingResult.selection },
    });
    const quoteDocument = applyTransaction(headingDocument, quoteResult.transaction!);

    if (!quoteResult.selection) {
      throw new Error("Toggle quote command should return a selection.");
    }

    const paragraphResult = toggleQuoteCommand.execute({
      context: { document: quoteDocument, selection: quoteResult.selection },
    });
    const paragraphDocument = applyTransaction(
      quoteDocument,
      paragraphResult.transaction!,
    );

    expect(headingDocument.children.map((block) => block.type)).toEqual([
      "heading",
      "heading",
      "heading",
    ]);
    expect(quoteDocument.children.map((block) => block.type)).toEqual([
      "quote",
      "quote",
      "quote",
    ]);
    expect(paragraphDocument.children).toEqual([
      {
        children: [{ marks: { bold: true }, text: "第一段", type: "text" }],
        type: "paragraph",
      },
      {
        children: [{ marks: { italic: true }, text: "第二段", type: "text" }],
        type: "paragraph",
      },
      {
        children: [{ marks: { underline: true }, text: "第三段", type: "text" }],
        type: "paragraph",
      },
    ]);
    expect(paragraphResult.selection).toEqual(selection);
    expect(validateDocument(paragraphDocument)).toEqual({ errors: [], valid: true });
  });
});

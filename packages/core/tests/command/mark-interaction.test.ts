import { describe, expect, it } from "vitest";

import {
  applyTransaction,
  boldCommand,
  createDocument,
  createParagraph,
  createText,
  isBoldCommandActive,
  isItalicCommandActive,
  italicCommand,
} from "../../src";

describe("bold and italic command interaction", () => {
  it("keeps mark state consistent across a mixed selection", () => {
    const document = createDocument([
      createParagraph([
        createText("加粗", { bold: true }),
        createText("组合", { bold: true, italic: true }),
      ]),
    ]);
    const selection = {
      anchor: { path: [0, 0], offset: 0 },
      focus: { path: [0, 1], offset: 2 },
    };
    const input = { context: { document, selection } };

    expect(isBoldCommandActive(input)).toBe(true);
    expect(isItalicCommandActive(input)).toBe(false);

    const italicResult = italicCommand.execute(input);
    const italicDocument = applyTransaction(document, italicResult.transaction!);

    if (!italicResult.selection) {
      throw new Error("Italic command should return a selection.");
    }

    const italicInput = {
      context: {
        document: italicDocument,
        selection: italicResult.selection,
      },
    };

    expect(italicDocument.children[0]?.children).toEqual([
      {
        type: "text",
        text: "加粗组合",
        marks: { bold: true, italic: true },
      },
    ]);
    expect(isBoldCommandActive(italicInput)).toBe(true);
    expect(isItalicCommandActive(italicInput)).toBe(true);

    const boldResult = boldCommand.execute(italicInput);

    expect(
      applyTransaction(italicDocument, boldResult.transaction!).children[0]?.children,
    ).toEqual([
      {
        type: "text",
        text: "加粗组合",
        marks: { italic: true },
      },
    ]);
  });
});

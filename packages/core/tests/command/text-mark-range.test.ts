import { describe, expect, it } from "vitest";

import {
  createCodeBlock,
  createDivider,
  createDocument,
  createHeading,
  createParagraph,
  createQuote,
  createText,
} from "../../src";
import {
  getTextMarkCommandRanges,
  restoreTextMarkCommandSelection,
} from "../../src/command/text-mark-range";

describe("text mark command ranges", () => {
  it("segments a range across supported text blocks", () => {
    const document = createDocument([
      createParagraph([createText("第一段")]),
      createHeading(2, [createText("标题")]),
      createQuote([createText("引用内容")]),
    ]);

    expect(
      getTextMarkCommandRanges(document, {
        anchor: { path: [0, 0], offset: 1 },
        focus: { path: [2, 0], offset: 2 },
      }),
    ).toEqual([
      {
        blockIndex: 0,
        range: {
          anchor: { path: [0, 0], offset: 1 },
          focus: { path: [0, 0], offset: 3 },
        },
      },
      {
        blockIndex: 1,
        range: {
          anchor: { path: [1, 0], offset: 0 },
          focus: { path: [1, 0], offset: 2 },
        },
      },
      {
        blockIndex: 2,
        range: {
          anchor: { path: [2, 0], offset: 0 },
          focus: { path: [2, 0], offset: 2 },
        },
      },
    ]);
  });

  it("rejects ranges crossing unsupported blocks", () => {
    const selection = {
      anchor: { path: [0, 0], offset: 1 },
      focus: { path: [2, 0], offset: 1 },
    };

    expect(
      getTextMarkCommandRanges(
        createDocument([
          createParagraph([createText("开头")]),
          createDivider(),
          createParagraph([createText("结尾")]),
        ]),
        selection,
      ),
    ).toBeUndefined();
    expect(
      getTextMarkCommandRanges(
        createDocument([
          createParagraph([createText("开头")]),
          createCodeBlock([createText("code")]),
          createParagraph([createText("结尾")]),
        ]),
        selection,
      ),
    ).toBeUndefined();
  });

  it("restores a reversed range after text nodes split", () => {
    const document = createDocument([
      createParagraph([createText("第一段")]),
      createParagraph([createText("第二段")]),
    ]);
    const selection = {
      anchor: { path: [1, 0], offset: 2 },
      focus: { path: [0, 0], offset: 1 },
    };
    const nextDocument = createDocument([
      createParagraph([createText("第"), createText("一段", { bold: true })]),
      createParagraph([createText("第二", { bold: true }), createText("段")]),
    ]);

    expect(restoreTextMarkCommandSelection(document, selection, nextDocument)).toEqual({
      anchor: { path: [1, 0], offset: 2 },
      focus: { path: [0, 1], offset: 0 },
    });
  });
});

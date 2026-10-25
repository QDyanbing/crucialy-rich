import { describe, expect, it } from "vitest";
import {
  createDocument,
  createHeading,
  createParagraph,
  createQuote,
  createText,
} from "../../src";
import {
  clipClipboardText,
  getClipboardTextBlocks,
} from "../../src/clipboard/selection-blocks";

describe("clipboard text block clipping", () => {
  it("keeps an empty boundary container without copying neighboring text", () => {
    expect(
      clipClipboardText([createText("未选文字", { bold: true })], [0, 0], {
        anchor: { path: [0, 0, 0], offset: 4 },
        focus: { path: [0, 1, 0], offset: 1 },
      }),
    ).toEqual([createText()]);
  });

  it("clips multiple styled children with full nested model paths", () => {
    const nodes = [
      createText("前甲", { bold: true }),
      createText("乙后", { italic: true }),
    ];
    expect(
      clipClipboardText(nodes, [0, 0, 2, 1], {
        anchor: { path: [0, 0, 2, 1, 0], offset: 1 },
        focus: { path: [0, 0, 2, 1, 1], offset: 1 },
      }),
    ).toEqual([createText("甲", { bold: true }), createText("乙", { italic: true })]);
  });
  it.each([false, true])(
    "clips only selected text and preserves marks (backward: %s)",
    (backward) => {
      const document = createDocument([
        createParagraph([
          createText("前甲", { bold: true }),
          createText("乙后", { italic: true }),
        ]),
      ]);
      const anchor = { path: [0, 0], offset: 1 };
      const focus = { path: [0, 1], offset: 1 };
      const before = structuredClone(document);
      const blocks = getClipboardTextBlocks(
        document,
        backward ? { anchor: focus, focus: anchor } : { anchor, focus },
      );
      expect(blocks).toEqual([
        createParagraph([
          createText("甲", { bold: true }),
          createText("乙", { italic: true }),
        ]),
      ]);
      blocks![0]!.children[0]!.text = "外部修改";
      delete blocks![0]!.children[0]!.marks!.bold;
      expect(document).toEqual(before);
    },
  );

  it("keeps block types and intermediate empty paragraphs", () => {
    const document = createDocument([
      createHeading(2, [createText("前标题")]),
      createParagraph(),
      createQuote([createText("引用后")]),
    ]);
    expect(
      getClipboardTextBlocks(document, {
        anchor: { path: [0, 0], offset: 1 },
        focus: { path: [2, 0], offset: 2 },
      }),
    ).toEqual([
      createHeading(2, [createText("标题")]),
      createParagraph(),
      createQuote([createText("引用")]),
    ]);
  });

  it("rejects collapsed and invalid endpoints", () => {
    const document = createDocument([createParagraph([createText("文字")])]);
    const point = { path: [0, 0], offset: 1 };
    expect(
      getClipboardTextBlocks(document, { anchor: point, focus: point }),
    ).toBeUndefined();
    expect(
      getClipboardTextBlocks(document, {
        anchor: point,
        focus: { path: [0, 0], offset: 9 },
      }),
    ).toBeUndefined();
  });
});

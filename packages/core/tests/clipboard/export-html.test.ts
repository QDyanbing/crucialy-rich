import { describe, expect, it } from "vitest";
import { createDocument, createHeading, createParagraph, createText } from "../../src";
import { getClipboardHtml } from "../../src/clipboard/export-html";

describe("getClipboardHtml", () => {
  it("serializes only selected text with semantic marks and no editor metadata", () => {
    const document = createDocument([
      createParagraph([
        createText("前甲", { bold: true }),
        createText("乙后", { italic: true }),
      ]),
    ]);
    expect(
      getClipboardHtml(document, {
        anchor: { path: [0, 0], offset: 1 },
        focus: { path: [0, 1], offset: 1 },
      }),
    ).toBe("<p><strong>甲</strong><em>乙</em></p>");
  });

  it("keeps heading levels and empty intermediate blocks", () => {
    const document = createDocument([
      createHeading(3, [createText("前标题")]),
      createParagraph(),
      createParagraph([createText("末尾")]),
    ]);
    expect(
      getClipboardHtml(document, {
        anchor: { path: [0, 0], offset: 1 },
        focus: { path: [2, 0], offset: 1 },
      }),
    ).toBe("<h3><span>标题</span></h3><p><span></span></p><p><span>末</span></p>");
  });

  it("does not export an empty or invalid selection", () => {
    const document = createDocument([createParagraph([createText("文字")])]);
    const anchor = { path: [0, 0], offset: 1 };
    expect(getClipboardHtml(document, { anchor, focus: anchor })).toBeUndefined();
    expect(
      getClipboardHtml(document, { anchor, focus: { path: [9, 0], offset: 0 } }),
    ).toBeUndefined();
  });
});

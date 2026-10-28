import { describe, expect, it } from "vitest";
import {
  createDocument,
  createImage,
  createParagraph,
  createText,
  getClipboardHtml,
  getClipboardText,
  parseHtml,
} from "../../src";

describe("enclosed image HTML clipboard export", () => {
  it.each([false, true])(
    "round trips image metadata and clipped text (%s)",
    (backward) => {
      const image = createImage("https://example.com/image.png", {
        alt: "中文图片",
        width: 640,
        height: 480,
      });
      const document = createDocument([
        createParagraph([createText("前甲", { bold: true })]),
        image,
        createParagraph([createText("乙后", { italic: true })]),
      ]);
      const before = structuredClone(document);
      const anchor = { path: [0, 0], offset: 1 };
      const focus = { path: [2, 0], offset: 1 };
      const selection = backward ? { anchor: focus, focus: anchor } : { anchor, focus };
      const html = getClipboardHtml(document, selection)!;
      expect(parseHtml(html)?.blocks).toEqual([
        createParagraph([createText("甲", { bold: true })]),
        image,
        createParagraph([createText("乙", { italic: true })]),
      ]);
      expect(getClipboardText(document, selection)).toBe("甲\n\n乙");
      expect(html).toContain('src="https://example.com/image.png"');
      expect(html).not.toMatch(/data-|aria-|contenteditable|class=|status=/i);
      expect(document).toEqual(before);
    },
  );
});

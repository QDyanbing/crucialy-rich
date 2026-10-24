import { describe, expect, it } from "vitest";
import {
  createCodeBlock,
  createDocument,
  createHeading,
  createParagraph,
  createQuote,
  createText,
  getClipboardHtml,
  parseHtml,
  type TextMarks,
} from "../../src";

describe("HTML clipboard parser round trip", () => {
  it.each([false, true])(
    "keeps combined marks and link metadata (underline: %s)",
    (underline) => {
      const marks: TextMarks = {
        bold: true,
        italic: true,
        code: true,
        strike: true,
        ...(underline ? { underline: true } : {}),
        fontSize: 24,
        textColor: "#123456",
        backgroundColor: "#abcdef",
        link: {
          href: "https://example.com/",
          target: "_blank",
          rel: "nofollow noopener noreferrer",
        },
      };
      const document = createDocument([createParagraph([createText("文字", marks)])]);
      const original = structuredClone(document);
      const html = getClipboardHtml(document, {
        anchor: { path: [0, 0], offset: 0 },
        focus: { path: [0, 0], offset: 2 },
      })!;
      expect(parseHtml(html)?.blocks).toEqual(document.children);
      expect(document).toEqual(original);
    },
  );

  it("keeps heading quote and literal multiline code blocks", () => {
    const document = createDocument([
      createHeading(2, [createText("标题", { bold: true })]),
      createQuote([createText("引用")]),
      createCodeBlock([createText("<b>\n  code")]),
    ]);
    const html = getClipboardHtml(document, {
      anchor: { path: [0, 0], offset: 0 },
      focus: { path: [2, 0], offset: "<b>\n  code".length },
    })!;
    expect(parseHtml(html)?.blocks).toEqual(document.children);
  });
});

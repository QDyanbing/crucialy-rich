import { describe, expect, it } from "vitest";
import {
  createImage,
  createParagraph,
  createText,
  parseHtml,
  createDocument,
  validateDocument,
} from "../../src";

const image = createImage("https://example.com/mixed.png", { alt: "配图" });
const img = '<img src="https://example.com/mixed.png" alt="配图">';

describe("HTML mixed paragraph images", () => {
  it("preserves text-image-text order as separate blocks", () => {
    const fragment = parseHtml(`<p>前文${img}后文</p>`);
    expect(fragment?.blocks).toEqual([
      createParagraph([createText("前文")]),
      image,
      createParagraph([createText("后文")]),
    ]);
    expect(validateDocument(createDocument(fragment!.blocks)).valid).toBe(true);
  });

  it.each([
    {
      html: `<p>${img}后文</p>`,
      blocks: [image, createParagraph([createText("后文")])],
    },
    {
      html: `<p>前文${img}</p>`,
      blocks: [createParagraph([createText("前文")]), image],
    },
    { html: `<p>${img}${img}</p>`, blocks: [image, image] },
  ])("does not create empty paragraphs for $html", ({ html, blocks }) => {
    expect(parseHtml(html)?.blocks).toEqual(blocks);
  });

  it("preserves nested text marks on both sides of an image", () => {
    expect(
      parseHtml(
        `<p><strong>前文<span style="color:#abc">${img}后文</span>结尾</strong></p>`,
      )?.blocks,
    ).toEqual([
      createParagraph([createText("前文", { bold: true })]),
      image,
      createParagraph([
        createText("后文", { bold: true, textColor: "#aabbcc" }),
        createText("结尾", { bold: true }),
      ]),
    ]);
  });

  it("preserves explicit line breaks and whitespace text around images", () => {
    expect(parseHtml(`<p> 前<br>${img}<br> 后 </p>`)?.blocks).toEqual([
      createParagraph([createText(" 前"), createText("\n")]),
      image,
      createParagraph([createText("\n"), createText(" 后 ")]),
    ]);
  });

  it("keeps standalone image and empty paragraph behavior", () => {
    expect(parseHtml(`<p>\n ${img}\n</p>`)?.blocks).toEqual([image]);
    expect(parseHtml("<p></p>")?.blocks).toEqual([createParagraph()]);
    expect(parseHtml('<p><img src="javascript:alert(1)"></p>')).toBeUndefined();
  });
});

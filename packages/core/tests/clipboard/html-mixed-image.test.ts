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
  it.each(["javascript:alert(1)", "data:image/png;base64,abc", "/relative.png", ""])(
    "drops unsafe mixed image %s without splitting or removing adjacent text",
    (src) => {
      expect(parseHtml(`<p><b>前<img src="${src}">后</b></p>`)?.blocks).toEqual([
        createParagraph([
          createText("前", { bold: true }),
          createText("后", { bold: true }),
        ]),
      ]);
    },
  );

  it("uses the existing URL and metadata whitelist for wrapped images", () => {
    expect(
      parseHtml(
        '<p><a href="https://example.com/docs" target="_blank">前<img src="https://example.com/mixed.png" alt="中文 &amp; 配图" width="640" height="0" onclick="bad()" style="width:99px">后</a></p>',
      )?.blocks,
    ).toEqual([
      createParagraph([
        createText("前", {
          link: { href: "https://example.com/docs", target: "_blank" },
        }),
      ]),
      createImage("https://example.com/mixed.png", { alt: "中文 & 配图", width: 640 }),
      createParagraph([
        createText("后", {
          link: { href: "https://example.com/docs", target: "_blank" },
        }),
      ]),
    ]);
  });

  it("does not attach unsafe links to text or imported image blocks", () => {
    expect(
      parseHtml(`<p><a href="javascript:alert(1)">前${img}后</a></p>`)?.blocks,
    ).toEqual([
      createParagraph([createText("前")]),
      image,
      createParagraph([createText("后")]),
    ]);
  });

  it("ignores hidden script, style and template contents", () => {
    expect(
      parseHtml(
        `<p>前<script>${img}</script><style>${img}</style><template>${img}</template>后</p>`,
      )?.blocks,
    ).toEqual([createParagraph([createText("前"), createText("后")])]);
  });

  it("keeps list and table paragraph models text-only", () => {
    const list = parseHtml(`<ul><li><p>前${img}后</p></li></ul>`);
    const table = parseHtml(`<table><tr><td><p>前${img}后</p></td></tr></table>`);
    expect(JSON.stringify(list)).not.toContain('"type":"image"');
    expect(JSON.stringify(table)).not.toContain('"type":"image"');
    expect(validateDocument(createDocument(list!.blocks)).valid).toBe(true);
    expect(validateDocument(createDocument(table!.blocks)).valid).toBe(true);
    expect(list?.blocks[0]).toMatchObject({
      children: [{ children: [{ text: "前" }, { text: "后" }] }],
    });
    expect(table?.blocks[0]).toMatchObject({
      children: [
        { children: [{ children: [{ children: [{ text: "前" }, { text: "后" }] }] }] },
      ],
    });
  });

  it("does not bypass Office plain text fallback", () => {
    expect(parseHtml(`<p class="MsoNormal">前${img}后</p>`)).toBeUndefined();
  });

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

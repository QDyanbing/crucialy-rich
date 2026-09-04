import { describe, expect, it } from "vitest";

import {
  createCodeBlock,
  createDocument,
  createDivider,
  createHeading,
  createParagraph,
  createQuote,
  createText,
} from "../../src/model";
import { renderDocument, renderNodeToHtml } from "../../src/render";

describe("renderNodeToHtml", () => {
  it("serializes rendered document nodes", () => {
    const document = createDocument([
      createParagraph([createText("Hello"), createText(" world")]),
    ]);

    expect(renderNodeToHtml(renderDocument(document))).toBe(
      '<div data-crucialy-path="[]"><p data-crucialy-path="[0]"><span data-crucialy-path="[0,0]">Hello</span><span data-crucialy-path="[0,1]"> world</span></p></div>',
    );
  });

  it("serializes all heading levels with semantic tags", () => {
    const document = createDocument(
      ([1, 2, 3, 4, 5, 6] as const).map((level) =>
        createHeading(level, [createText(`标题 ${level}`)]),
      ),
    );
    const html = renderNodeToHtml(renderDocument(document));

    for (const level of [1, 2, 3, 4, 5, 6]) {
      expect(html).toContain(
        `<h${level} data-crucialy-path="[${level - 1}]"><span data-crucialy-path="[${level - 1},0]">标题 ${level}</span></h${level}>`,
      );
    }
  });

  it("serializes quote blocks with their model paths", () => {
    const document = createDocument([
      createQuote([createText("引用内容", { italic: true })]),
    ]);

    expect(renderNodeToHtml(renderDocument(document))).toContain(
      '<blockquote data-crucialy-path="[0]"><em data-crucialy-path="[0,0]">引用内容</em></blockquote>',
    );
  });

  it("serializes code blocks with escaped multiline text", () => {
    const document = createDocument([
      createCodeBlock([createText('const value = "<safe>";\nreturn value;')]),
    ]);

    expect(renderNodeToHtml(renderDocument(document))).toContain(
      '<pre data-crucialy-path="[0]"><code data-crucialy-path="[0,0]">const value = &quot;&lt;safe&gt;&quot;;\nreturn value;</code></pre>',
    );
  });

  it("serializes dividers as void hr elements", () => {
    const document = createDocument([createDivider()]);

    expect(renderNodeToHtml(renderDocument(document))).toBe(
      '<div data-crucialy-path="[]"><hr data-crucialy-path="[0]"></div>',
    );
  });

  it("escapes text and attribute values", () => {
    const document = createDocument([createParagraph([createText('<script>"&')])]);

    expect(renderNodeToHtml(renderDocument(document))).toContain(
      "&lt;script&gt;&quot;&amp;",
    );
  });

  it("serializes bold text marks as strong elements", () => {
    const document = createDocument([
      createParagraph([createText("Bold", { bold: true })]),
    ]);

    expect(renderNodeToHtml(renderDocument(document))).toContain(
      '<strong data-crucialy-path="[0,0]">Bold</strong>',
    );
  });

  it("serializes italic text marks as em elements", () => {
    const document = createDocument([
      createParagraph([createText("Italic", { italic: true })]),
    ]);

    expect(renderNodeToHtml(renderDocument(document))).toContain(
      '<em data-crucialy-path="[0,0]">Italic</em>',
    );
  });

  it("serializes underline text marks as u elements", () => {
    const document = createDocument([
      createParagraph([createText("Underline", { underline: true })]),
    ]);

    expect(renderNodeToHtml(renderDocument(document))).toContain(
      '<u data-crucialy-path="[0,0]">Underline</u>',
    );
  });

  it("serializes strike text marks as s elements", () => {
    const document = createDocument([
      createParagraph([createText("Strike", { strike: true })]),
    ]);

    expect(renderNodeToHtml(renderDocument(document))).toContain(
      '<s data-crucialy-path="[0,0]">Strike</s>',
    );
  });

  it("serializes safe link attributes", () => {
    const document = createDocument([
      createParagraph([
        createText("Search", {
          link: {
            href: "https://example.com/search?q=a&next=%22docs%22",
            rel: "nofollow noopener",
            target: "_blank",
          },
        }),
      ]),
    ]);

    expect(renderNodeToHtml(renderDocument(document))).toContain(
      '<a data-crucialy-path="[0,0]" href="https://example.com/search?q=a&amp;next=%22docs%22" rel="nofollow noopener" target="_blank" style="text-decoration: underline;">Search</a>',
    );
  });

  it("does not serialize unsafe links as anchors", () => {
    const document = createDocument([
      createParagraph([
        createText("Unsafe", { link: { href: "javascript:alert(1)" } }),
      ]),
    ]);
    const html = renderNodeToHtml(renderDocument(document));

    expect(html).not.toContain("<a");
    expect(html).not.toContain("javascript:");
    expect(html).toContain('<span data-crucialy-path="[0,0]">Unsafe</span>');
  });

  it("serializes links with composed text mark styles", () => {
    const document = createDocument([
      createParagraph([
        createText("Styled link", {
          backgroundColor: "#fff4cc",
          bold: true,
          fontSize: 18,
          italic: true,
          link: { href: "https://example.com/docs" },
          strike: true,
          textColor: "#1677ff",
        }),
      ]),
    ]);

    expect(renderNodeToHtml(renderDocument(document))).toContain(
      '<a data-crucialy-path="[0,0]" href="https://example.com/docs" style="background-color: #fff4cc; color: #1677ff; font-size: 18px; font-style: italic; font-weight: 700; text-decoration: underline line-through;">Styled link</a>',
    );
  });

  it("serializes combined bold and italic marks with italic style", () => {
    const document = createDocument([
      createParagraph([createText("Both", { bold: true, italic: true })]),
    ]);

    expect(renderNodeToHtml(renderDocument(document))).toContain(
      '<strong data-crucialy-path="[0,0]" style="font-style: italic;">Both</strong>',
    );
  });

  it("serializes underline combined with bold and italic", () => {
    const document = createDocument([
      createParagraph([
        createText("Stacked", {
          bold: true,
          italic: true,
          underline: true,
        }),
      ]),
    ]);

    expect(renderNodeToHtml(renderDocument(document))).toContain(
      '<strong data-crucialy-path="[0,0]" style="font-style: italic; text-decoration: underline;">Stacked</strong>',
    );
  });

  it("serializes all boolean marks with combined decoration", () => {
    const document = createDocument([
      createParagraph([
        createText("All", {
          bold: true,
          italic: true,
          strike: true,
          underline: true,
        }),
      ]),
    ]);

    expect(renderNodeToHtml(renderDocument(document))).toContain(
      '<strong data-crucialy-path="[0,0]" style="font-style: italic; text-decoration: underline line-through;">All</strong>',
    );
  });

  it("serializes a supported font size as pixels", () => {
    const document = createDocument([
      createParagraph([createText("Sized", { fontSize: 18 })]),
    ]);

    expect(renderNodeToHtml(renderDocument(document))).toContain(
      '<span data-crucialy-path="[0,0]" style="font-size: 18px;">Sized</span>',
    );
  });

  it("serializes font size with boolean mark styles", () => {
    const document = createDocument([
      createParagraph([
        createText("Combined", {
          bold: true,
          fontSize: 24,
          italic: true,
          underline: true,
        }),
      ]),
    ]);

    expect(renderNodeToHtml(renderDocument(document))).toContain(
      '<strong data-crucialy-path="[0,0]" style="font-size: 24px; font-style: italic; text-decoration: underline;">Combined</strong>',
    );
  });

  it("serializes a safe text color", () => {
    const document = createDocument([
      createParagraph([createText("Colored", { textColor: "#0AF" })]),
    ]);

    expect(renderNodeToHtml(renderDocument(document))).toContain(
      '<span data-crucialy-path="[0,0]" style="color: #00aaff;">Colored</span>',
    );
  });

  it("serializes text color with font size and boolean mark styles", () => {
    const document = createDocument([
      createParagraph([
        createText("Combined", {
          bold: true,
          fontSize: 24,
          italic: true,
          textColor: "#1677ff",
          underline: true,
        }),
      ]),
    ]);

    expect(renderNodeToHtml(renderDocument(document))).toContain(
      '<strong data-crucialy-path="[0,0]" style="color: #1677ff; font-size: 24px; font-style: italic; text-decoration: underline;">Combined</strong>',
    );
  });

  it("serializes a safe background color", () => {
    const document = createDocument([
      createParagraph([createText("Highlighted", { backgroundColor: "#FC0" })]),
    ]);

    expect(renderNodeToHtml(renderDocument(document))).toContain(
      '<span data-crucialy-path="[0,0]" style="background-color: #ffcc00;">Highlighted</span>',
    );
  });

  it("serializes background color with text color and other styles", () => {
    const document = createDocument([
      createParagraph([
        createText("Combined", {
          backgroundColor: "#fff4cc",
          bold: true,
          fontSize: 24,
          italic: true,
          textColor: "#1677ff",
          underline: true,
        }),
      ]),
    ]);

    expect(renderNodeToHtml(renderDocument(document))).toContain(
      '<strong data-crucialy-path="[0,0]" style="background-color: #fff4cc; color: #1677ff; font-size: 24px; font-style: italic; text-decoration: underline;">Combined</strong>',
    );
  });
});

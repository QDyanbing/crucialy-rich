import { describe, expect, it } from "vitest";

import { createDocument, createParagraph, createText } from "../../src/model";
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

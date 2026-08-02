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
});

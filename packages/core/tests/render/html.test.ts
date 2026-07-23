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
});

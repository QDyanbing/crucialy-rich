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
});

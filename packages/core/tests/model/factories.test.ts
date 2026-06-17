import { describe, expect, it } from "vitest";

import { createDocument, createParagraph, createText } from "../../src/model/factories";
import { isDocumentNode, isParagraphNode, isTextNode } from "../../src/model/guards";

describe("model factories", () => {
  it("creates an empty text node by default", () => {
    const text = createText();
    expect(isTextNode(text)).toBe(true);
    expect(text.text).toBe("");
  });

  it("creates a text node with given content", () => {
    expect(createText("hi").text).toBe("hi");
  });

  it("creates a paragraph with a default empty text", () => {
    const paragraph = createParagraph();
    expect(isParagraphNode(paragraph)).toBe(true);
    expect(paragraph.children).toHaveLength(1);
    expect(paragraph.children[0]?.text).toBe("");
  });

  it("creates a paragraph from given text nodes", () => {
    const paragraph = createParagraph([createText("a"), createText("b")]);
    expect(paragraph.children.map((node) => node.text)).toEqual(["a", "b"]);
  });

  it("creates a document with a default empty paragraph", () => {
    const document = createDocument();
    expect(isDocumentNode(document)).toBe(true);
    expect(document.children).toHaveLength(1);
    expect(document.children[0]?.type).toBe("paragraph");
  });
});

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

  it("creates a text node with cloned marks", () => {
    const marks = {
      bold: true as const,
      italic: true as const,
      strike: true as const,
      underline: true as const,
    };
    const text = createText("hi", marks);

    expect(text).toEqual({
      type: "text",
      text: "hi",
      marks: {
        bold: true,
        italic: true,
        strike: true,
        underline: true,
      },
    });
    expect(text.marks).not.toBe(marks);
  });

  it("creates text with attribute and boolean marks", () => {
    const marks = {
      backgroundColor: "#fff4cc",
      bold: true as const,
      fontSize: 16,
      textColor: "#1c2520",
    };
    const text = createText("styled", marks);

    expect(text).toEqual({
      type: "text",
      text: "styled",
      marks,
    });
    expect(text.marks).not.toBe(marks);
  });

  it("creates text with a normalized cloned link mark", () => {
    const link = {
      href: "HTTPS://Example.COM/docs",
      rel: "noreferrer noopener",
      target: "_blank" as const,
    };
    const text = createText("文档", { bold: true, link });

    expect(text.marks).toEqual({
      bold: true,
      link: {
        href: "https://example.com/docs",
        rel: "noopener noreferrer",
        target: "_blank",
      },
    });
    expect(text.marks?.link).not.toBe(link);
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

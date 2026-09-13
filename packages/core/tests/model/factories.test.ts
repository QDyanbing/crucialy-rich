import { describe, expect, it } from "vitest";

import {
  createBulletList,
  createCodeBlock,
  createDocument,
  createDivider,
  createHeading,
  createImage,
  createListItem,
  createOrderedList,
  createParagraph,
  createQuote,
  createText,
  createTaskItem,
  createTaskList,
} from "../../src/model/factories";
import {
  isCodeBlockNode,
  isDocumentNode,
  isDividerNode,
  isHeadingNode,
  isImageNode,
  isParagraphNode,
  isQuoteNode,
  isTextNode,
} from "../../src/model/guards";

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

  it("creates headings with a default empty text", () => {
    const defaultHeading = createHeading();
    const heading = createHeading(3, [createText("三级标题")]);

    expect(isHeadingNode(defaultHeading)).toBe(true);
    expect(defaultHeading).toEqual({
      children: [{ text: "", type: "text" }],
      level: 1,
      type: "heading",
    });
    expect(heading.level).toBe(3);
    expect(heading.children[0]?.text).toBe("三级标题");
  });

  it("creates quotes with a default empty text", () => {
    const defaultQuote = createQuote();
    const quote = createQuote([createText("引用内容")]);

    expect(isQuoteNode(defaultQuote)).toBe(true);
    expect(defaultQuote).toEqual({
      children: [{ text: "", type: "text" }],
      type: "quote",
    });
    expect(quote.children[0]?.text).toBe("引用内容");
  });

  it("creates code blocks as plain text", () => {
    const defaultCodeBlock = createCodeBlock();
    const codeBlock = createCodeBlock([
      createText("const answer = 42;", { bold: true }),
    ]);

    expect(isCodeBlockNode(defaultCodeBlock)).toBe(true);
    expect(defaultCodeBlock.children).toEqual([{ text: "", type: "text" }]);
    expect(codeBlock).toEqual({
      children: [{ text: "const answer = 42;", type: "text" }],
      type: "codeBlock",
    });
  });

  it("creates dividers without editable children", () => {
    const divider = createDivider();

    expect(isDividerNode(divider)).toBe(true);
    expect(divider).toEqual({ children: [], type: "divider" });
  });

  it("creates images with stable defaults", () => {
    const first = createImage("https://example.com/cover.png");
    const second = createImage("blob:https://example.com/local");

    expect(isImageNode(first)).toBe(true);
    expect(first).toEqual({
      alt: "",
      children: [],
      height: null,
      src: "https://example.com/cover.png",
      status: "ready",
      type: "image",
      width: null,
    });
    expect(first.children).not.toBe(second.children);
  });

  it("creates images with explicit metadata", () => {
    expect(
      createImage("https://example.com/cover.png", {
        alt: "项目封面",
        height: 480,
        status: "loading",
        width: 640,
      }),
    ).toMatchObject({
      alt: "项目封面",
      height: 480,
      status: "loading",
      width: 640,
    });
  });

  it("creates list items and both list types", () => {
    const item = createListItem([createText("第一项", { bold: true })]);
    const bulletList = createBulletList([item]);
    const orderedList = createOrderedList([createListItem()]);

    expect(bulletList).toEqual({
      children: [item],
      type: "bulletList",
    });
    expect(orderedList).toEqual({
      children: [{ children: [{ text: "", type: "text" }], type: "listItem" }],
      type: "orderedList",
    });
  });

  it("creates a list item with a nested list", () => {
    const nested = createBulletList([createListItem([createText("子项")])]);

    expect(createListItem([createText("父项")], nested)).toEqual({
      children: [createText("父项")],
      nested,
      type: "listItem",
    });
  });

  it("creates checked and unchecked task items", () => {
    const taskList = createTaskList([
      createTaskItem([createText("待办")]),
      createTaskItem([createText("完成")], true),
    ]);

    expect(taskList).toEqual({
      children: [
        { checked: false, children: [createText("待办")], type: "taskItem" },
        { checked: true, children: [createText("完成")], type: "taskItem" },
      ],
      type: "taskList",
    });
  });

  it("creates a document with a default empty paragraph", () => {
    const document = createDocument();
    expect(isDocumentNode(document)).toBe(true);
    expect(document.children).toHaveLength(1);
    expect(document.children[0]?.type).toBe("paragraph");
  });
});

import { describe, expect, it } from "vitest";

import {
  BLOCK_TYPES,
  HEADING_LEVELS,
  LINK_REL_TOKENS,
  LINK_TARGETS,
  LIST_TYPES,
  TEXT_MARK_ATTRIBUTE_TYPES,
  TEXT_MARK_TYPES,
  VOID_BLOCK_TYPES,
  type BlockType,
  type DocumentNode,
  type HeadingLevel,
  type HeadingNode,
  type LinkMarkAttributes,
  type LinkRelToken,
  type LinkTarget,
  type ListNode,
  type ListType,
  type ParagraphNode,
  type QuoteNode,
  type TextMarkAttributes,
  type TextMarkAttributeType,
  type TextMarkType,
  type TextNode,
} from "../../src/model/types";

describe("model node types", () => {
  it("describes the supported block types", () => {
    const blockType: BlockType = "heading";
    const headingLevel: HeadingLevel = 2;
    const heading: HeadingNode = {
      children: [{ text: "标题", type: "text" }],
      level: headingLevel,
      type: blockType,
    };
    const quote: QuoteNode = {
      children: [{ text: "引用", type: "text" }],
      type: "quote",
    };

    expect(BLOCK_TYPES).toEqual([
      "paragraph",
      "heading",
      "quote",
      "codeBlock",
      "divider",
      "bulletList",
      "orderedList",
    ]);
    expect(VOID_BLOCK_TYPES).toEqual(["divider"]);
    expect(HEADING_LEVELS).toEqual([1, 2, 3, 4, 5, 6]);
    expect(heading.level).toBe(2);
    expect(quote.type).toBe("quote");
  });

  it("describes ordered and unordered lists", () => {
    const listType: ListType = "bulletList";
    const list: ListNode = {
      children: [
        {
          children: [{ text: "第一项", type: "text" }],
          type: "listItem",
        },
      ],
      type: listType,
    };

    expect(LIST_TYPES).toEqual(["bulletList", "orderedList"]);
    expect(list.children[0]?.type).toBe("listItem");
  });

  it("describes a document with paragraph and text", () => {
    const text: TextNode = { type: "text", text: "hello" };
    const paragraph: ParagraphNode = { type: "paragraph", children: [text] };
    const document: DocumentNode = { type: "document", children: [paragraph] };

    expect(document.type).toBe("document");
    expect(document.children[0]?.type).toBe("paragraph");
    expect(document.children[0]?.children[0]?.text).toBe("hello");
  });

  it("describes text marks on text nodes", () => {
    const underline: TextMarkType = "underline";
    const strike: TextMarkType = "strike";
    const text: TextNode = {
      type: "text",
      text: "hello",
      marks: {
        bold: true,
        italic: true,
        [underline]: true,
        [strike]: true,
      },
    };

    expect(TEXT_MARK_TYPES).toEqual(["bold", "italic", "underline", "strike"]);
    expect(text.marks?.bold).toBe(true);
    expect(text.marks?.italic).toBe(true);
    expect(text.marks?.underline).toBe(true);
    expect(text.marks?.strike).toBe(true);
  });

  it("describes attribute and boolean marks together", () => {
    const fontSizeAttribute: TextMarkAttributeType = "fontSize";
    const attributes: TextMarkAttributes = {
      backgroundColor: "#fff4cc",
      fontSize: 16,
      textColor: "#1c2520",
    };
    const text: TextNode = {
      type: "text",
      text: "styled",
      marks: { bold: true, ...attributes },
    };

    expect(TEXT_MARK_ATTRIBUTE_TYPES).toEqual([
      "fontSize",
      "textColor",
      "backgroundColor",
    ]);
    expect(text.marks?.[fontSizeAttribute]).toBe(16);
    expect(text.marks?.bold).toBe(true);
    expect(text.marks?.textColor).toBe("#1c2520");
    expect(text.marks?.backgroundColor).toBe("#fff4cc");
  });

  it("describes a structured link mark", () => {
    const target: LinkTarget = "_blank";
    const relToken: LinkRelToken = "noopener";
    const link: LinkMarkAttributes = {
      href: "https://example.com/docs",
      rel: `${relToken} noreferrer`,
      target,
    };
    const text: TextNode = {
      marks: { bold: true, link },
      text: "Documentation",
      type: "text",
    };

    expect(LINK_TARGETS).toEqual(["_self", "_blank"]);
    expect(LINK_REL_TOKENS).toEqual(["nofollow", "noopener", "noreferrer"]);
    expect(text.marks?.link).toEqual(link);
    expect(text.marks?.bold).toBe(true);
  });
});

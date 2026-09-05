import { describe, expect, it } from "vitest";

import {
  isBlockNode,
  isBulletListNode,
  isCodeBlockNode,
  isDocumentNode,
  isDividerNode,
  isHeadingLevel,
  isHeadingNode,
  isListItemNode,
  isListNode,
  isListType,
  isOrderedListNode,
  isParagraphNode,
  isQuoteNode,
  isTextNode,
  isTextBlockNode,
  isVoidBlockNode,
} from "../../src/model/guards";

describe("model type guards", () => {
  it("recognizes a text node", () => {
    expect(isTextNode({ type: "text", text: "a" })).toBe(true);
    expect(isTextNode({ type: "text" })).toBe(false);
    expect(isTextNode({ type: "paragraph", children: [] })).toBe(false);
    expect(isTextNode(null)).toBe(false);
  });

  it("recognizes a paragraph node", () => {
    expect(isParagraphNode({ type: "paragraph", children: [] })).toBe(true);
    expect(isParagraphNode({ type: "paragraph" })).toBe(false);
    expect(isParagraphNode({ type: "text", text: "a" })).toBe(false);
  });

  it("recognizes heading levels and heading nodes", () => {
    expect(isHeadingLevel(1)).toBe(true);
    expect(isHeadingLevel(6)).toBe(true);
    expect(isHeadingLevel(0)).toBe(false);
    expect(isHeadingLevel(7)).toBe(false);
    expect(isHeadingLevel(1.5)).toBe(false);
    expect(isHeadingLevel("1")).toBe(false);
    expect(isHeadingNode({ type: "heading", level: 2, children: [] })).toBe(true);
    expect(isHeadingNode({ type: "heading", level: 7, children: [] })).toBe(false);
    expect(isHeadingNode({ type: "heading", level: 2 })).toBe(false);
  });

  it("recognizes quote nodes", () => {
    expect(isQuoteNode({ type: "quote", children: [] })).toBe(true);
    expect(isQuoteNode({ type: "quote" })).toBe(false);
    expect(isQuoteNode({ type: "paragraph", children: [] })).toBe(false);
  });

  it("recognizes code block nodes", () => {
    expect(isCodeBlockNode({ type: "codeBlock", children: [] })).toBe(true);
    expect(isCodeBlockNode({ type: "codeBlock" })).toBe(false);
    expect(isBlockNode({ type: "codeBlock", children: [] })).toBe(true);
  });

  it("distinguishes text blocks from void blocks", () => {
    const divider = { children: [], type: "divider" };

    expect(isDividerNode(divider)).toBe(true);
    expect(isVoidBlockNode(divider)).toBe(true);
    expect(isTextBlockNode(divider)).toBe(false);
    expect(isBlockNode(divider)).toBe(true);
    expect(isDividerNode({ type: "divider" })).toBe(false);
  });

  it("recognizes list types and list nodes", () => {
    const item = { children: [{ text: "项目", type: "text" }], type: "listItem" };
    const bulletList = { children: [item], type: "bulletList" };
    const orderedList = { children: [item], type: "orderedList" };

    expect(isListType("bulletList")).toBe(true);
    expect(isListType("orderedList")).toBe(true);
    expect(isListType("taskList")).toBe(false);
    expect(isListItemNode(item)).toBe(true);
    expect(isBulletListNode(bulletList)).toBe(true);
    expect(isOrderedListNode(orderedList)).toBe(true);
    expect(isListNode(bulletList)).toBe(true);
    expect(isListNode(orderedList)).toBe(true);
  });

  it("treats paragraph as a block node", () => {
    expect(isBlockNode({ type: "paragraph", children: [] })).toBe(true);
    expect(isBlockNode({ type: "document", children: [] })).toBe(false);
  });

  it("recognizes a document node", () => {
    expect(isDocumentNode({ type: "document", children: [] })).toBe(true);
    expect(isDocumentNode({ type: "document" })).toBe(false);
    expect(isDocumentNode(undefined)).toBe(false);
  });
});

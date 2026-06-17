import { describe, expect, it } from "vitest";

import {
  isBlockNode,
  isDocumentNode,
  isParagraphNode,
  isTextNode,
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

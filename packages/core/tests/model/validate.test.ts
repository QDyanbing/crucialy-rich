import { describe, expect, it } from "vitest";

import { createDocument, createParagraph, createText } from "../../src/model/factories";
import { validateDocument } from "../../src/model/validate";

describe("validateDocument", () => {
  it("accepts a well-formed document", () => {
    const document = createDocument([createParagraph([createText("hi")])]);
    expect(validateDocument(document)).toEqual({ valid: true, errors: [] });
  });

  it("accepts an empty document", () => {
    const result = validateDocument({ type: "document", children: [] });
    expect(result.valid).toBe(true);
  });

  it("rejects a non-document root", () => {
    const result = validateDocument({ type: "paragraph", children: [] });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toEqual({
      path: [],
      message: "根节点必须是 document 节点",
    });
  });

  it("rejects a non-block document child", () => {
    const result = validateDocument({
      type: "document",
      children: [{ type: "text", text: "loose" }],
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0]?.path).toEqual([0]);
  });

  it("rejects an unknown document child type", () => {
    const result = validateDocument({
      type: "document",
      children: [{ type: "heading", children: [] }],
    });

    expect(result.valid).toBe(false);
    expect(result.errors[0]).toEqual({
      path: [0],
      message: "document 子节点必须是块级节点",
    });
  });

  it("rejects a non-text paragraph child", () => {
    const result = validateDocument({
      type: "document",
      children: [
        { type: "paragraph", children: [{ type: "paragraph", children: [] }] },
      ],
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0]?.path).toEqual([0, 0]);
  });

  it("rejects an unknown paragraph child type", () => {
    const result = validateDocument({
      type: "document",
      children: [{ type: "paragraph", children: [{ type: "inline", text: "x" }] }],
    });

    expect(result.valid).toBe(false);
    expect(result.errors[0]).toEqual({
      path: [0, 0],
      message: "paragraph 子节点必须是 text 节点",
    });
  });
});

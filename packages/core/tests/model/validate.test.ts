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
      message: "root must be a document node",
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
});

import { describe, expect, it } from "vitest";

import { normalizeDocument } from "../../src/model/normalize";
import { validateDocument } from "../../src/model/validate";

describe("normalizeDocument", () => {
  it("replaces a non-document root with an empty document", () => {
    const result = normalizeDocument({ type: "text", text: "loose" });
    expect(result.type).toBe("document");
    expect(validateDocument(result).valid).toBe(true);
  });

  it("fills an empty document with one empty paragraph", () => {
    const result = normalizeDocument({ type: "document", children: [] });
    expect(result.children).toHaveLength(1);
    expect(result.children[0]?.type).toBe("paragraph");
  });

  it("fills an empty paragraph with one empty text", () => {
    const result = normalizeDocument({
      type: "document",
      children: [{ type: "paragraph", children: [] }],
    });
    expect(result.children[0]?.children).toHaveLength(1);
    expect(result.children[0]?.children[0]?.text).toBe("");
  });

  it("drops invalid document children", () => {
    const result = normalizeDocument({
      type: "document",
      children: [
        { type: "text", text: "loose" },
        { type: "paragraph", children: [{ type: "text", text: "keep" }] },
      ],
    });

    expect(result.children).toHaveLength(1);
    expect(result.children[0]?.children[0]?.text).toBe("keep");
    expect(validateDocument(result).valid).toBe(true);
  });

  it("drops invalid paragraph children", () => {
    const result = normalizeDocument({
      type: "document",
      children: [
        {
          type: "paragraph",
          children: [
            { type: "text", text: "keep" },
            { type: "paragraph", children: [] },
          ],
        },
      ],
    });
    expect(result.children[0]?.children).toHaveLength(1);
    expect(result.children[0]?.children[0]?.text).toBe("keep");
    expect(validateDocument(result).valid).toBe(true);
  });
});

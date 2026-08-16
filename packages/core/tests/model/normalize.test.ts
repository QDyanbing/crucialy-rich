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

  it("preserves supported text marks", () => {
    const result = normalizeDocument({
      type: "document",
      children: [
        {
          type: "paragraph",
          children: [
            {
              type: "text",
              text: "keep",
              marks: {
                backgroundColor: "#fff4cc",
                bold: true,
                fontSize: 16,
                italic: true,
                strike: true,
                textColor: "#1c2520",
                underline: true,
              },
            },
          ],
        },
      ],
    });

    expect(result.children[0]?.children[0]?.marks).toEqual({
      backgroundColor: "#fff4cc",
      bold: true,
      fontSize: 16,
      italic: true,
      strike: true,
      textColor: "#1c2520",
      underline: true,
    });
    expect(validateDocument(result).valid).toBe(true);
  });

  it("drops unsupported or disabled text marks", () => {
    const result = normalizeDocument({
      type: "document",
      children: [
        {
          type: "paragraph",
          children: [
            {
              type: "text",
              text: "keep",
              marks: {
                backgroundColor: "",
                bold: false,
                fontSize: -1,
                highlight: true,
                italic: true,
                strike: false,
                textColor: 123,
                underline: true,
              },
            },
          ],
        },
      ],
    });

    expect(result.children[0]?.children[0]).toEqual({
      type: "text",
      text: "keep",
      marks: { italic: true, underline: true },
    });
    expect(validateDocument(result).valid).toBe(true);
  });

  it("normalizes safe text colors and removes unsafe colors", () => {
    const result = normalizeDocument({
      type: "document",
      children: [
        {
          type: "paragraph",
          children: [
            { type: "text", text: "安全", marks: { textColor: "#0AF" } },
            { type: "text", text: "非法", marks: { textColor: "red" } },
          ],
        },
      ],
    });

    expect(result.children[0]?.children).toEqual([
      { marks: { textColor: "#00aaff" }, text: "安全", type: "text" },
      { text: "非法", type: "text" },
    ]);
    expect(validateDocument(result).valid).toBe(true);
  });

  it("normalizes safe background colors and removes unsafe colors", () => {
    const result = normalizeDocument({
      type: "document",
      children: [
        {
          type: "paragraph",
          children: [
            {
              type: "text",
              text: "安全",
              marks: { backgroundColor: "#FC0" },
            },
            {
              type: "text",
              text: "非法",
              marks: { backgroundColor: "yellow" },
            },
          ],
        },
      ],
    });

    expect(result.children[0]?.children).toEqual([
      { marks: { backgroundColor: "#ffcc00" }, text: "安全", type: "text" },
      { text: "非法", type: "text" },
    ]);
    expect(validateDocument(result).valid).toBe(true);
  });

  it("merges adjacent text nodes with equal marks", () => {
    const result = normalizeDocument({
      type: "document",
      children: [
        {
          type: "paragraph",
          children: [
            { type: "text", text: "你", marks: { bold: true } },
            { type: "text", text: "好", marks: { bold: true } },
            { type: "text", text: "世", marks: { italic: true } },
            { type: "text", text: "界", marks: { italic: true } },
          ],
        },
      ],
    });

    expect(result.children[0]?.children).toEqual([
      { type: "text", text: "你好", marks: { bold: true } },
      { type: "text", text: "世界", marks: { italic: true } },
    ]);
    expect(validateDocument(result).valid).toBe(true);
  });

  it("keeps text nodes split when marks differ", () => {
    const result = normalizeDocument({
      type: "document",
      children: [
        {
          type: "paragraph",
          children: [
            { type: "text", text: "你", marks: { bold: true } },
            { type: "text", text: "好", marks: { italic: true } },
          ],
        },
      ],
    });

    expect(result.children[0]?.children).toEqual([
      { type: "text", text: "你", marks: { bold: true } },
      { type: "text", text: "好", marks: { italic: true } },
    ]);
    expect(validateDocument(result).valid).toBe(true);
  });
});

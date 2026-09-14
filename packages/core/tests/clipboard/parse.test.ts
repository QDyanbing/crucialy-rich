import { describe, expect, it, vi } from "vitest";

import {
  CLIPBOARD_ALLOWED_ATTRIBUTES,
  CLIPBOARD_ALLOWED_TAGS,
  createParagraph,
  createText,
  parseClipboardData,
  type ClipboardParser,
} from "../../src";

describe("parseClipboardData", () => {
  it("uses the first parser that returns a fragment", () => {
    const htmlParse = vi.fn(() => ({
      blocks: [createParagraph([createText("HTML")])],
      mimeType: "text/html" as const,
    }));
    const plainParse = vi.fn(() => ({
      blocks: [createParagraph([createText("纯文本")])],
      mimeType: "text/plain" as const,
    }));
    const parsers: ClipboardParser[] = [
      { mimeType: "text/html", parse: htmlParse },
      { mimeType: "text/plain", parse: plainParse },
    ];
    const result = parseClipboardData(
      {
        getData: (type) => (type === "text/html" ? "<p>HTML</p>" : "纯文本"),
        types: ["text/plain", "text/html"],
      },
      parsers,
    );

    expect(result?.mimeType).toBe("text/html");
    expect(htmlParse).toHaveBeenCalledOnce();
    expect(plainParse).not.toHaveBeenCalled();
  });

  it("falls back when a parser declines the value", () => {
    const fallback = vi.fn(() => ({
      blocks: [createParagraph([createText("回退")])],
      mimeType: "text/plain" as const,
    }));
    const result = parseClipboardData(
      {
        getData: (type) => (type === "text/html" ? "<invalid>" : "回退"),
        types: ["text/html", "text/plain"],
      },
      [
        { mimeType: "text/html", parse: () => undefined },
        { mimeType: "text/plain", parse: fallback },
      ],
    );

    expect(result?.mimeType).toBe("text/plain");
    expect(fallback).toHaveBeenCalledOnce();
  });

  it("publishes the clipboard sanitize whitelist", () => {
    expect(CLIPBOARD_ALLOWED_TAGS).toContain("strong");
    expect(CLIPBOARD_ALLOWED_TAGS).not.toContain("script");
    expect(CLIPBOARD_ALLOWED_ATTRIBUTES).toEqual({ a: ["href"] });
  });
});

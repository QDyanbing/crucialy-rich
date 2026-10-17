import { describe, expect, it, vi } from "vitest";

import {
  CLIPBOARD_ALLOWED_ATTRIBUTES,
  CLIPBOARD_ALLOWED_TAGS,
  createParagraph,
  createText,
  parseClipboardData,
  DEFAULT_CLIPBOARD_PARSERS,
  type ClipboardParser,
} from "../../src";

describe("parseClipboardData", () => {
  it("continues to plain text when the consumer rejects a rich fragment", () => {
    const source = {
      types: ["text/html", "text/plain"],
      getData: (type: string) =>
        type === "text/html" ? "<p>富文本</p>" : "原始纯文本",
    };
    expect(
      parseClipboardData(
        source,
        DEFAULT_CLIPBOARD_PARSERS,
        (fragment) => fragment.mimeType === "text/plain",
      ),
    ).toEqual({
      blocks: [createParagraph([createText("原始纯文本")])],
      mimeType: "text/plain",
    });
  });

  it("keeps the existing MIME priority when no filter is supplied", () => {
    const source = {
      types: ["text/plain", "text/html", "text/markdown"],
      getData: (type: string) =>
        type === "text/markdown"
          ? "# 标题"
          : type === "text/html"
            ? "<p>HTML</p>"
            : "纯文本",
    };
    expect(parseClipboardData(source, DEFAULT_CLIPBOARD_PARSERS)?.mimeType).toBe(
      "text/markdown",
    );
  });

  it("returns no fragment when the consumer rejects every available format", () => {
    expect(
      parseClipboardData(
        { types: ["text/html"], getData: () => "<p>只提供 HTML</p>" },
        DEFAULT_CLIPBOARD_PARSERS,
        () => false,
      ),
    ).toBeUndefined();
  });

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

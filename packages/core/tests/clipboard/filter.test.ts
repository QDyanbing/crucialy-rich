import { describe, expect, it, vi } from "vitest";
import {
  createParagraph,
  createText,
  DEFAULT_CLIPBOARD_PARSERS,
  parseClipboardData,
  type ClipboardFragment,
  type ClipboardParser,
} from "../../src";

function plain(text: string): ClipboardFragment {
  return { mimeType: "text/plain", blocks: [createParagraph([createText(text)])] };
}

describe("clipboard fragment filtering", () => {
  it("does not read later formats once a fragment is accepted", () => {
    const getData = vi.fn(() => "<p>优先内容</p>");
    const accept = vi.fn(() => true);
    const result = parseClipboardData(
      { types: ["text/plain", "text/html"], getData },
      DEFAULT_CLIPBOARD_PARSERS,
      accept,
    );
    expect(result?.mimeType).toBe("text/html");
    expect(getData.mock.calls).toEqual([["text/html"]]);
    expect(accept).toHaveBeenCalledTimes(1);
  });

  it("can continue to a later parser for the same MIME type", () => {
    const first = plain("拒绝");
    const second = plain("接收");
    const parsers: ClipboardParser[] = [
      { mimeType: "text/plain", parse: () => first },
      { mimeType: "text/plain", parse: () => second },
    ];
    const accept = vi.fn((fragment: ClipboardFragment) => fragment === second);
    expect(
      parseClipboardData(
        { types: ["text/plain"], getData: () => "数据" },
        parsers,
        accept,
      ),
    ).toBe(second);
    expect(accept.mock.calls).toEqual([[first], [second]]);
  });

  it("does not filter absent, empty or declined parser results", () => {
    const accept = vi.fn(() => true);
    const parse = vi.fn(() => undefined);
    const getData = vi.fn((type: string) => (type === "text/plain" ? "数据" : ""));
    const result = parseClipboardData(
      { types: ["text/html", "text/plain"], getData },
      [
        { mimeType: "text/markdown", parse },
        { mimeType: "text/html", parse },
        { mimeType: "text/plain", parse },
      ],
      accept,
    );
    expect(result).toBeUndefined();
    expect(parse).toHaveBeenCalledExactlyOnceWith("数据");
    expect(accept).not.toHaveBeenCalled();
    expect(getData.mock.calls).toEqual([["text/html"], ["text/plain"]]);
  });

  it("visits valid candidates in configured order rather than source order", () => {
    const seen: string[] = [];
    const result = parseClipboardData(
      {
        types: ["text/plain", "text/html", "text/markdown"],
        getData: (type) =>
          type === "text/markdown"
            ? "# 标题"
            : type === "text/html"
              ? "<b>HTML</b>"
              : "原文",
      },
      DEFAULT_CLIPBOARD_PARSERS,
      (fragment) => {
        seen.push(fragment.mimeType);
        return false;
      },
    );
    expect(result).toBeUndefined();
    expect(seen).toEqual(["text/markdown", "text/html", "text/plain"]);
  });

  it("does not read or filter when no parser matches", () => {
    const getData = vi.fn(() => "数据");
    const accept = vi.fn(() => true);
    expect(
      parseClipboardData(
        { types: ["image/png"], getData },
        DEFAULT_CLIPBOARD_PARSERS,
        accept,
      ),
    ).toBeUndefined();
    expect(
      parseClipboardData({ types: ["text/plain"], getData }, [], accept),
    ).toBeUndefined();
    expect(getData).not.toHaveBeenCalled();
    expect(accept).not.toHaveBeenCalled();
  });
});

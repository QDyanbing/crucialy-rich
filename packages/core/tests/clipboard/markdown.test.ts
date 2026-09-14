import { describe, expect, it } from "vitest";

import {
  DEFAULT_CLIPBOARD_PARSERS,
  parseClipboardData,
  parseMarkdown,
  validateDocument,
} from "../../src";

describe("parseMarkdown", () => {
  it("maps headings, quotes, code, and inline marks", () => {
    const fragment = parseMarkdown(
      "# 标题\n\n> 引用\n\n**加粗** 与 *斜体*\n\n```ts\nconst value = 1;\n```",
    );

    expect(fragment?.blocks.map((block) => block.type)).toEqual([
      "heading",
      "quote",
      "paragraph",
      "codeBlock",
    ]);
    expect(fragment?.blocks[2]).toMatchObject({
      children: [
        { marks: { bold: true }, text: "加粗" },
        { text: " 与 " },
        { marks: { italic: true }, text: "斜体" },
      ],
    });
    expect(fragment?.blocks[3]).toMatchObject({
      children: [{ text: "const value = 1;\n" }],
    });
  });

  it("maps ordered and unordered Markdown lists", () => {
    const fragment = parseMarkdown("- 无序一\n- 无序二\n\n1. 有序一\n2. 有序二");

    expect(fragment?.blocks.map((block) => block.type)).toEqual([
      "bulletList",
      "orderedList",
    ]);
    expect(
      validateDocument({ children: fragment?.blocks ?? [], type: "document" }).valid,
    ).toBe(true);
  });

  it("takes precedence over HTML and plain text in the default parser list", () => {
    const result = parseClipboardData(
      {
        getData: (type) =>
          type === "text/markdown"
            ? "## Markdown 标题"
            : type === "text/html"
              ? "<p>HTML</p>"
              : "纯文本",
        types: ["text/plain", "text/html", "text/markdown"],
      },
      DEFAULT_CLIPBOARD_PARSERS,
    );

    expect(result?.mimeType).toBe("text/markdown");
    expect(result?.blocks[0]?.type).toBe("heading");
  });

  it("declines empty Markdown", () => {
    expect(parseMarkdown("   \n")).toBeUndefined();
  });
});

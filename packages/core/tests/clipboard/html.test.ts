import { describe, expect, it } from "vitest";

import { parseHtml, validateDocument } from "../../src";

describe("parseHtml", () => {
  it("maps paragraphs, inline marks, and safe links", () => {
    const fragment = parseHtml(
      '<p>普通<strong>加粗</strong><em>斜体</em><a href="https://example.com/docs">链接</a></p>',
    );

    expect(fragment?.blocks[0]).toEqual({
      children: [
        { text: "普通", type: "text" },
        { marks: { bold: true }, text: "加粗", type: "text" },
        { marks: { italic: true }, text: "斜体", type: "text" },
        {
          marks: { link: { href: "https://example.com/docs" } },
          text: "链接",
          type: "text",
        },
      ],
      type: "paragraph",
    });
  });

  it("maps ordered and unordered lists", () => {
    const fragment = parseHtml(
      "<ul><li>无序一</li><li>无序二</li></ul><ol><li>有序一</li></ol>",
    );

    expect(fragment?.blocks.map((block) => block.type)).toEqual([
      "bulletList",
      "orderedList",
    ]);
    expect(fragment?.blocks[0]).toMatchObject({
      children: [
        { children: [{ text: "无序一" }] },
        { children: [{ text: "无序二" }] },
      ],
    });
  });

  it("drops scripts and unsafe link attributes", () => {
    const fragment = parseHtml(
      '<p><script>alert(1)</script><a href="javascript:alert(2)" onclick="alert(3)">安全文本</a></p>',
    );

    expect(fragment?.blocks[0]).toEqual({
      children: [{ text: "安全文本", type: "text" }],
      type: "paragraph",
    });
    expect(
      validateDocument({ children: fragment?.blocks ?? [], type: "document" }).valid,
    ).toBe(true);
  });

  it("declines empty and blocked-only HTML", () => {
    expect(parseHtml("")).toBeUndefined();
    expect(parseHtml("<style>body { color: red; }</style>")).toBeUndefined();
  });
});

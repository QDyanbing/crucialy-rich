import { describe, expect, it } from "vitest";

import { isTableNode, parseHtml, validateDocument } from "../../src";

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

  it("maps a basic HTML table", () => {
    const fragment = parseHtml(
      "<table><tr><td>姓名</td><td>角色</td></tr><tr><td>小明</td><td>开发</td></tr></table>",
    );

    expect(fragment?.blocks[0]).toEqual({
      children: [
        {
          children: [
            {
              children: [
                { children: [{ text: "姓名", type: "text" }], type: "paragraph" },
              ],
              type: "tableCell",
            },
            {
              children: [
                { children: [{ text: "角色", type: "text" }], type: "paragraph" },
              ],
              type: "tableCell",
            },
          ],
          type: "tableRow",
        },
        {
          children: [
            {
              children: [
                { children: [{ text: "小明", type: "text" }], type: "paragraph" },
              ],
              type: "tableCell",
            },
            {
              children: [
                { children: [{ text: "开发", type: "text" }], type: "paragraph" },
              ],
              type: "tableCell",
            },
          ],
          type: "tableRow",
        },
      ],
      type: "table",
    });
    expect(
      validateDocument({ children: fragment?.blocks ?? [], type: "document" }).valid,
    ).toBe(true);
  });

  it("maps table sections and header cells in source order", () => {
    const fragment = parseHtml(
      "<table><thead><tr><th>表头</th></tr></thead><tbody><tr><td>正文</td></tr></tbody><tfoot><tr><td>汇总</td></tr></tfoot></table>",
    );
    const table = fragment?.blocks[0];

    expect(isTableNode(table)).toBe(true);

    if (!isTableNode(table)) {
      throw new Error("expected parsed table");
    }

    expect(
      table.children.map((row) => row.children[0]?.children[0]?.children[0]?.text),
    ).toEqual(["表头", "正文", "汇总"]);
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

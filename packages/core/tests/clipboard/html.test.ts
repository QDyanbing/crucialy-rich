import { describe, expect, it } from "vitest";

import {
  isImageNode,
  isTableNode,
  isTaskListNode,
  parseHtml,
  validateDocument,
} from "../../src";

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

  it("preserves supported HTML link targets", () => {
    const fragment = parseHtml(
      '<p><a href="https://example.com/docs" target="_blank">新窗口链接</a></p>',
    );

    expect(fragment?.blocks[0]).toMatchObject({
      children: [
        {
          marks: {
            link: { href: "https://example.com/docs", target: "_blank" },
          },
          text: "新窗口链接",
        },
      ],
      type: "paragraph",
    });
  });

  it("preserves supported HTML link rel tokens", () => {
    const fragment = parseHtml(
      '<p><a href="https://example.com/docs" rel="nofollow noopener noreferrer">安全关系链接</a></p>',
    );

    expect(fragment?.blocks[0]).toMatchObject({
      children: [
        {
          marks: {
            link: {
              href: "https://example.com/docs",
              rel: "nofollow noopener noreferrer",
            },
          },
          text: "安全关系链接",
        },
      ],
      type: "paragraph",
    });
  });

  it("normalizes pasted HTML link metadata", () => {
    const fragment = parseHtml(
      '<p><a href=" https://example.com/docs " target=" _BLANK " rel="NoReferrer noopener noopener">规范化链接</a></p>',
    );

    expect(fragment?.blocks[0]).toMatchObject({
      children: [
        {
          marks: {
            link: {
              href: "https://example.com/docs",
              rel: "noopener noreferrer",
              target: "_blank",
            },
          },
          text: "规范化链接",
        },
      ],
      type: "paragraph",
    });
  });

  it("drops unsupported HTML link metadata without dropping the link", () => {
    const fragment = parseHtml(
      '<p><a href="https://example.com/docs" target="_parent" rel="noopener sponsored">降级链接</a></p>',
    );

    expect(fragment?.blocks[0]).toMatchObject({
      children: [
        {
          marks: { link: { href: "https://example.com/docs" } },
          text: "降级链接",
        },
      ],
      type: "paragraph",
    });
  });

  it("maps HTML b elements to bold marks", () => {
    const fragment = parseHtml("<p><b>浏览器加粗</b></p>");

    expect(fragment?.blocks[0]).toMatchObject({
      children: [{ marks: { bold: true }, text: "浏览器加粗" }],
      type: "paragraph",
    });
  });

  it("maps HTML i elements to italic marks", () => {
    const fragment = parseHtml("<p><i>浏览器斜体</i></p>");

    expect(fragment?.blocks[0]).toMatchObject({
      children: [{ marks: { italic: true }, text: "浏览器斜体" }],
      type: "paragraph",
    });
  });

  it("maps HTML u elements to underline marks", () => {
    const fragment = parseHtml("<p><u>浏览器下划线</u></p>");

    expect(fragment?.blocks[0]).toMatchObject({
      children: [{ marks: { underline: true }, text: "浏览器下划线" }],
      type: "paragraph",
    });
  });

  it("maps HTML strike element aliases to strike marks", () => {
    const fragment = parseHtml(
      "<p><s>现代删除线</s><strike>传统删除线</strike><del>删除语义</del></p>",
    );

    expect(fragment?.blocks[0]).toMatchObject({
      children: [
        { marks: { strike: true }, text: "现代删除线" },
        { marks: { strike: true }, text: "传统删除线" },
        { marks: { strike: true }, text: "删除语义" },
      ],
      type: "paragraph",
    });
  });

  it("preserves nested mark aliases while sanitizing links", () => {
    const fragment = parseHtml(
      '<p><a href="https://example.com/docs"><b><i><u><del>组合样式</del></u></i></b></a><a href="javascript:alert(1)"><u>危险链接文本</u></a></p>',
    );

    expect(fragment?.blocks[0]).toMatchObject({
      children: [
        {
          marks: {
            bold: true,
            italic: true,
            link: { href: "https://example.com/docs" },
            strike: true,
            underline: true,
          },
          text: "组合样式",
        },
        {
          marks: { underline: true },
          text: "危险链接文本",
        },
      ],
      type: "paragraph",
    });
  });

  it("preserves link metadata with nested mark aliases", () => {
    const fragment = parseHtml(
      '<p><a href="https://example.com/docs" target="_blank" rel="noopener noreferrer"><b><i><u><del>组合链接</del></u></i></b></a></p>',
    );

    expect(fragment?.blocks[0]).toMatchObject({
      children: [
        {
          marks: {
            bold: true,
            italic: true,
            link: {
              href: "https://example.com/docs",
              rel: "noopener noreferrer",
              target: "_blank",
            },
            strike: true,
            underline: true,
          },
          text: "组合链接",
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

  it("maps nested unordered HTML lists", () => {
    const fragment = parseHtml(
      "<ul><li>父项<ul><li>子项</li></ul></li><li>同级项</li></ul>",
    );

    expect(fragment?.blocks[0]).toMatchObject({
      children: [
        {
          children: [{ text: "父项" }],
          nested: {
            children: [{ children: [{ text: "子项" }], type: "listItem" }],
            type: "bulletList",
          },
          type: "listItem",
        },
        { children: [{ text: "同级项" }], type: "listItem" },
      ],
      type: "bulletList",
    });
  });

  it("preserves nested ordered HTML list types", () => {
    const fragment = parseHtml(
      "<ul><li>步骤<ol><li>第一步</li><li>第二步</li></ol></li></ul>",
    );

    expect(fragment?.blocks[0]).toMatchObject({
      children: [
        {
          children: [{ text: "步骤" }],
          nested: {
            children: [
              { children: [{ text: "第一步" }] },
              { children: [{ text: "第二步" }] },
            ],
            type: "orderedList",
          },
        },
      ],
      type: "bulletList",
    });
  });

  it("preserves mixed HTML list types", () => {
    const fragment = parseHtml("<ol><li>有序父项<ul><li>无序子项</li></ul></li></ol>");

    expect(fragment?.blocks[0]).toMatchObject({
      children: [
        {
          children: [{ text: "有序父项" }],
          nested: {
            children: [{ children: [{ text: "无序子项" }] }],
            type: "bulletList",
          },
        },
      ],
      type: "orderedList",
    });
  });

  it("caps pasted HTML lists at the model depth limit", () => {
    const fragment = parseHtml(
      "<ul><li>一级<ul><li>二级<ul><li>三级<ul><li>四级</li></ul></li></ul></li></ul></li></ul>",
    );
    const topList = fragment?.blocks[0];

    expect(topList).toMatchObject({
      children: [
        {
          nested: {
            children: [
              {
                nested: {
                  children: [
                    {
                      children: [{ text: "三级" }],
                      type: "listItem",
                    },
                  ],
                  type: "bulletList",
                },
              },
            ],
          },
        },
      ],
      type: "bulletList",
    });
    expect(
      validateDocument({ children: fragment?.blocks ?? [], type: "document" }).valid,
    ).toBe(true);
  });

  it("preserves marks and links in nested HTML list items", () => {
    const fragment = parseHtml(
      '<ul><li><strong>父项</strong><ol><li><a href="https://example.com/docs" target="_blank" rel="noopener">子项链接</a></li></ol></li></ul>',
    );

    expect(fragment?.blocks[0]).toMatchObject({
      children: [
        {
          children: [{ marks: { bold: true }, text: "父项" }],
          nested: {
            children: [
              {
                children: [
                  {
                    marks: {
                      link: {
                        href: "https://example.com/docs",
                        rel: "noopener",
                        target: "_blank",
                      },
                    },
                    text: "子项链接",
                  },
                ],
              },
            ],
            type: "orderedList",
          },
        },
      ],
    });
  });

  it("keeps wrapped parent content separate from nested list text", () => {
    const fragment = parseHtml(
      "<ul><li><p><strong>包装父项</strong></p><ul><li><em>独立子项</em></li></ul></li></ul>",
    );

    expect(fragment?.blocks[0]).toMatchObject({
      children: [
        {
          children: [{ marks: { bold: true }, text: "包装父项" }],
          nested: {
            children: [
              {
                children: [{ marks: { italic: true }, text: "独立子项" }],
              },
            ],
          },
        },
      ],
    });
  });

  it("maps an unchecked HTML task list", () => {
    const fragment = parseHtml(
      '<ul><li><input type="checkbox">待处理</li><li><input type="checkbox">待复核</li></ul>',
    );
    const taskList = fragment?.blocks[0];

    expect(isTaskListNode(taskList)).toBe(true);
    expect(taskList).toEqual({
      children: [
        {
          checked: false,
          children: [{ text: "待处理", type: "text" }],
          type: "taskItem",
        },
        {
          checked: false,
          children: [{ text: "待复核", type: "text" }],
          type: "taskItem",
        },
      ],
      type: "taskList",
    });
    expect(
      validateDocument({ children: fragment?.blocks ?? [], type: "document" }).valid,
    ).toBe(true);
  });

  it("preserves checked HTML task items", () => {
    const fragment = parseHtml(
      '<ul><li><input type="checkbox" checked>已完成</li><li><input type="checkbox">未完成</li></ul>',
    );
    const taskList = fragment?.blocks[0];

    expect(isTaskListNode(taskList)).toBe(true);

    if (!isTaskListNode(taskList)) {
      throw new Error("expected parsed task list");
    }

    expect(taskList).toMatchObject({
      children: [{ checked: true }, { checked: false }],
    });
  });

  it("preserves nested HTML task list state", () => {
    const fragment = parseHtml(
      '<ul><li><input type="checkbox" checked>父任务<ul><li><input type="checkbox">子任务</li></ul></li></ul>',
    );

    expect(fragment?.blocks[0]).toMatchObject({
      children: [
        {
          checked: true,
          children: [{ text: "父任务" }],
          nested: {
            children: [
              {
                checked: false,
                children: [{ text: "子任务" }],
                type: "taskItem",
              },
            ],
            type: "taskList",
          },
          type: "taskItem",
        },
      ],
      type: "taskList",
    });
    expect(
      validateDocument({ children: fragment?.blocks ?? [], type: "document" }).valid,
    ).toBe(true);
  });

  it("preserves inline marks and safe links in HTML task items", () => {
    const fragment = parseHtml(
      '<ul><li><input type="checkbox"><strong>加粗</strong><em>斜体</em><a href="https://example.com/task">链接</a></li></ul>',
    );
    const taskList = fragment?.blocks[0];

    expect(taskList).toMatchObject({
      children: [
        {
          children: [
            { marks: { bold: true }, text: "加粗" },
            { marks: { italic: true }, text: "斜体" },
            {
              marks: { link: { href: "https://example.com/task" } },
              text: "链接",
            },
          ],
          type: "taskItem",
        },
      ],
      type: "taskList",
    });
  });

  it("preserves link metadata in HTML task items", () => {
    const fragment = parseHtml(
      '<ul><li><input type="checkbox"><a href="https://example.com/task" target="_blank" rel="nofollow noopener">任务链接</a></li></ul>',
    );

    expect(fragment?.blocks[0]).toMatchObject({
      children: [
        {
          children: [
            {
              marks: {
                link: {
                  href: "https://example.com/task",
                  rel: "nofollow noopener",
                  target: "_blank",
                },
              },
              text: "任务链接",
            },
          ],
          type: "taskItem",
        },
      ],
      type: "taskList",
    });
  });

  it("recognizes leading task checkboxes inside common wrappers", () => {
    const fragment = parseHtml(
      '<ul data-type="taskList"><li><label><span><input type="checkbox" checked></span></label><div><p><strong>包装任务</strong></p></div></li><li><p><input type="checkbox">段落任务</p></li></ul>',
    );

    expect(fragment?.blocks[0]).toMatchObject({
      children: [
        {
          checked: true,
          children: [{ marks: { bold: true }, text: "包装任务" }],
          type: "taskItem",
        },
        {
          checked: false,
          children: [{ text: "段落任务" }],
          type: "taskItem",
        },
      ],
      type: "taskList",
    });
  });

  it("keeps ambiguous checkbox lists as regular lists", () => {
    const mixed = parseHtml(
      '<ul><li><input type="checkbox">任务</li><li>普通项</li></ul>',
    );
    const nonLeading = parseHtml(
      '<ul><li>正文<input type="checkbox">尾部控件</li></ul>',
    );
    const radio = parseHtml('<ul><li><input type="radio">单选项</li></ul>');
    const ordered = parseHtml(
      '<ol><li><input type="checkbox" checked>有序项</li></ol>',
    );

    expect(mixed?.blocks[0]).toMatchObject({
      children: [{ type: "listItem" }, { type: "listItem" }],
      type: "bulletList",
    });
    expect(nonLeading?.blocks[0]).toMatchObject({
      children: [{ children: [{ text: "正文" }, { text: "尾部控件" }] }],
      type: "bulletList",
    });
    expect(radio?.blocks[0]).toMatchObject({
      children: [{ type: "listItem" }],
      type: "bulletList",
    });
    expect(ordered?.blocks[0]).toMatchObject({
      children: [{ type: "listItem" }],
      type: "orderedList",
    });
  });

  it("maps a safe top-level HTML image", () => {
    const fragment = parseHtml('<img src="https://example.com/cover.png">');
    const image = fragment?.blocks[0];

    expect(isImageNode(image)).toBe(true);
    expect(image).toEqual({
      alt: "",
      children: [],
      height: null,
      src: "https://example.com/cover.png",
      status: "ready",
      type: "image",
      width: null,
    });
    expect(
      validateDocument({ children: fragment?.blocks ?? [], type: "document" }).valid,
    ).toBe(true);
  });

  it("preserves HTML image alternative text", () => {
    const fragment = parseHtml(
      '<img src="https://example.com/cover.png" alt="中文 &amp; preview">',
    );

    expect(fragment?.blocks[0]).toMatchObject({
      alt: "中文 & preview",
      src: "https://example.com/cover.png",
      type: "image",
    });
  });

  it("preserves positive integer HTML image dimensions", () => {
    const fragment = parseHtml(
      '<img src="https://example.com/cover.png" width="640" height="360">',
    );

    expect(fragment?.blocks[0]).toMatchObject({
      height: 360,
      src: "https://example.com/cover.png",
      type: "image",
      width: 640,
    });
  });

  it("rejects unsafe image sources and unsupported attributes", () => {
    expect(parseHtml('<img src="javascript:alert(1)" alt="危险图片">')).toBeUndefined();
    expect(parseHtml('<img src="data:image/png;base64,abc">')).toBeUndefined();
    expect(parseHtml('<img src="/relative.png">')).toBeUndefined();

    const fragment = parseHtml(
      '<img src="https://example.com/safe.png" width="0" height="360px" style="width: 640px" onerror="alert(1)">',
    );

    expect(fragment?.blocks[0]).toEqual({
      alt: "",
      children: [],
      height: null,
      src: "https://example.com/safe.png",
      status: "ready",
      type: "image",
      width: null,
    });
  });

  it("promotes a standalone paragraph image to an image block", () => {
    const fragment = parseHtml(
      '<p>\n  <img src="https://example.com/inside-paragraph.png" alt="段落图片">\n</p>',
    );

    expect(fragment?.blocks).toEqual([
      {
        alt: "段落图片",
        children: [],
        height: null,
        src: "https://example.com/inside-paragraph.png",
        status: "ready",
        type: "image",
        width: null,
      },
    ]);
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

  it("pads short HTML table rows to a rectangular grid", () => {
    const fragment = parseHtml(
      "<table><tr><td>甲</td></tr><tr><td>乙</td><td>丙</td></tr></table>",
    );
    const table = fragment?.blocks[0];

    expect(isTableNode(table)).toBe(true);

    if (!isTableNode(table)) {
      throw new Error("expected parsed table");
    }

    expect(table.children.map((row) => row.children.length)).toEqual([2, 2]);
    expect(table.children[0]?.children[1]?.children[0]?.children[0]?.text).toBe("");
    expect(validateDocument({ children: [table], type: "document" }).valid).toBe(true);
  });

  it("preserves paragraphs inside HTML table cells", () => {
    const fragment = parseHtml(
      "<table><tr><td><p>第一段</p><p>第二段</p></td></tr></table>",
    );
    const table = fragment?.blocks[0];

    expect(isTableNode(table)).toBe(true);

    if (!isTableNode(table)) {
      throw new Error("expected parsed table");
    }

    expect(table.children[0]?.children[0]?.children).toEqual([
      { children: [{ text: "第一段", type: "text" }], type: "paragraph" },
      { children: [{ text: "第二段", type: "text" }], type: "paragraph" },
    ]);
  });

  it("preserves inline marks and line breaks inside table cells", () => {
    const fragment = parseHtml(
      "<table><tr><td><p><strong>加粗</strong><em>斜体</em><br>换行</p></td></tr></table>",
    );
    const table = fragment?.blocks[0];

    expect(isTableNode(table)).toBe(true);

    if (!isTableNode(table)) {
      throw new Error("expected parsed table");
    }

    expect(table.children[0]?.children[0]?.children[0]?.children).toEqual([
      { marks: { bold: true }, text: "加粗", type: "text" },
      { marks: { italic: true }, text: "斜体", type: "text" },
      { text: "\n", type: "text" },
      { text: "换行", type: "text" },
    ]);
  });

  it("sanitizes links inside HTML table cells", () => {
    const fragment = parseHtml(
      '<table><tr><td><a href="https://example.com/docs">安全链接</a></td><td><a href="javascript:alert(1)">危险链接</a></td></tr></table>',
    );
    const table = fragment?.blocks[0];

    expect(isTableNode(table)).toBe(true);

    if (!isTableNode(table)) {
      throw new Error("expected parsed table");
    }

    expect(table.children[0]?.children[0]?.children[0]?.children[0]).toEqual({
      marks: { link: { href: "https://example.com/docs" } },
      text: "安全链接",
      type: "text",
    });
    expect(table.children[0]?.children[1]?.children[0]?.children[0]).toEqual({
      text: "危险链接",
      type: "text",
    });
  });

  it("preserves link metadata inside HTML table cells", () => {
    const fragment = parseHtml(
      '<table><tr><td><a href="https://example.com/docs" target="_blank" rel="noopener noreferrer">表格链接</a></td></tr></table>',
    );
    const table = fragment?.blocks[0];

    expect(isTableNode(table)).toBe(true);

    if (!isTableNode(table)) {
      throw new Error("expected parsed table");
    }

    expect(table.children[0]?.children[0]?.children[0]?.children[0]).toEqual({
      marks: {
        link: {
          href: "https://example.com/docs",
          rel: "noopener noreferrer",
          target: "_blank",
        },
      },
      text: "表格链接",
      type: "text",
    });
  });

  it("declines empty and blocked-only HTML tables", () => {
    expect(parseHtml("<table></table>")).toBeUndefined();
    expect(parseHtml("<table><tr></tr></table>")).toBeUndefined();
    expect(parseHtml("<table><script>alert(1)</script></table>")).toBeUndefined();
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

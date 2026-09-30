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

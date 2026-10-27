import { describe, expect, it } from "vitest";
import {
  createBulletList,
  createCodeBlock,
  createDivider,
  createDocument,
  createHeading,
  createListItem,
  createOrderedList,
  createParagraph,
  createQuote,
  createTable,
  createTaskItem,
  createTaskList,
  createText,
  getClipboardHtml,
  parseHtml,
} from "../../src";

describe("mixed block HTML clipboard export", () => {
  it.each([
    createDivider(),
    createOrderedList([createListItem([createText("列表")])], 5),
    createTaskList([createTaskItem([createText("完成")], true)]),
    createBulletList([
      createListItem(
        [createText("父")],
        createOrderedList([createListItem([createText("子", { code: true })])], 3),
      ),
    ]),
    createTable(2, 2),
  ])("round trips an enclosed $type between clipped text blocks", (block) => {
    const document = createDocument([
      createParagraph([createText("未选前段")]),
      createHeading(2, [createText("前甲", { bold: true })]),
      block,
      createParagraph(),
      createQuote([createText("乙后", { italic: true })]),
      createParagraph([createText("未选后段")]),
    ]);
    const anchor = { path: [1, 0], offset: 1 };
    const focus = { path: [4, 0], offset: 1 };
    const html = getClipboardHtml(document, { anchor, focus })!;
    expect(parseHtml(html)?.blocks).toEqual([
      createHeading(2, [createText("甲", { bold: true })]),
      block,
      createParagraph(),
      createQuote([createText("乙", { italic: true })]),
    ]);
    expect(getClipboardHtml(document, { anchor: focus, focus: anchor })).toBe(html);
    expect(html).not.toMatch(/未选|data-|aria-|contenteditable|class=/i);
  });

  it("keeps code boundaries literal and strips unsupported code marks", () => {
    const document = createDocument([
      createCodeBlock([createText("前<b>\n\t", { bold: true })]),
      createDivider(),
      createParagraph([createText("乙后")]),
    ]);
    const html = getClipboardHtml(document, {
      anchor: { path: [0, 0], offset: 1 },
      focus: { path: [2, 0], offset: 1 },
    })!;
    expect(html).toContain("<pre><code>&lt;b&gt;\n\t</code></pre><hr>");
    expect(html).not.toContain("<strong>");
  });
});

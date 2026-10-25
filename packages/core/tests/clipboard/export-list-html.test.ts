import { describe, expect, it } from "vitest";
import {
  createBulletList,
  createDocument,
  createListItem,
  createOrderedList,
  createTaskItem,
  createTaskList,
  createText,
  getClipboardHtml,
  parseHtml,
} from "../../src";

describe("sibling list HTML clipboard export", () => {
  it.each(["bullet", "ordered", "task"])(
    "round trips %s list structure with only selected entries",
    (type) => {
      const items = ["前项", "甲", "乙"].map((text) =>
        createListItem([createText(text, { bold: true })]),
      );
      const list =
        type === "ordered"
          ? createOrderedList(items, 5)
          : type === "task"
            ? createTaskList(
                items.map((item, index) => createTaskItem(item.children, index === 1)),
              )
            : createBulletList(items);
      const expected =
        type === "ordered"
          ? createOrderedList(items.slice(1), 6)
          : type === "task"
            ? createTaskList([
                createTaskItem(items[1]!.children, true),
                createTaskItem(items[2]!.children),
              ])
            : createBulletList(items.slice(1));
      const document = createDocument([list]);
      const html = getClipboardHtml(document, {
        anchor: { path: [0, 1, 0], offset: 0 },
        focus: { path: [0, 2, 0], offset: 1 },
      })!;
      expect(parseHtml(html)?.blocks).toEqual([expected]);
      expect(html).not.toMatch(/前项|data-|aria-|contenteditable|readonly/i);
      if (type === "ordered") expect(html).toContain('<ol start="6">');
      if (type === "task") expect(html).toContain('type="checkbox"');
    },
  );

  it("keeps selected nested sublists but not the final item's unselected subtree", () => {
    const nested = createOrderedList([createListItem([createText("子项")])], 3);
    const document = createDocument([
      createBulletList([
        createListItem([createText("前甲")], nested),
        createListItem(
          [createText("乙后")],
          createBulletList([createListItem([createText("不应复制")])]),
        ),
      ]),
    ]);
    const html = getClipboardHtml(document, {
      anchor: { path: [0, 0, 0], offset: 1 },
      focus: { path: [0, 1, 0], offset: 1 },
    })!;
    expect(parseHtml(html)?.blocks).toEqual([
      createBulletList([
        createListItem([createText("甲")], nested),
        createListItem([createText("乙")]),
      ]),
    ]);
    expect(html).not.toContain("不应复制");
  });

  it("keeps the existing paragraph export for a single item excerpt", () => {
    const document = createDocument([
      createBulletList([createListItem([createText("文字", { bold: true })])]),
    ]);
    expect(
      getClipboardHtml(document, {
        anchor: { path: [0, 0, 0], offset: 0 },
        focus: { path: [0, 0, 0], offset: 2 },
      }),
    ).toBe("<p><strong>文字</strong></p>");
  });
});

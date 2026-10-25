import { describe, expect, it } from "vitest";
import {
  createBulletList,
  createDocument,
  createListItem,
  createOrderedList,
  createText,
  getClipboardHtml,
  getClipboardText,
  parseHtml,
  type TextNode,
} from "../../src";

describe("list HTML clipboard range boundaries", () => {
  const nested = () =>
    createBulletList([
      createListItem([createText("子甲")]),
      createListItem([createText("子乙")]),
    ]);

  it("does not export a partial tree for parent-to-descendant ranges", () => {
    const document = createDocument([
      createBulletList([createListItem([createText("父项")], nested())]),
    ]);
    const selection = {
      anchor: { path: [0, 0, 0], offset: 0 },
      focus: { path: [0, 0, 1, 1, 0], offset: 2 },
    };
    expect(getClipboardText(document, selection)).toBe("父项\n子甲\n子乙");
    expect(getClipboardHtml(document, selection)).toBeUndefined();
  });

  it("does not combine separate root or nested list owners", () => {
    const document = createDocument([
      createBulletList([
        createListItem([createText("前项")], nested()),
        createListItem([createText("后项")], nested()),
      ]),
      nested(),
    ]);
    for (const selection of [
      { anchor: { path: [0, 0, 0], offset: 0 }, focus: { path: [1, 1, 0], offset: 2 } },
      {
        anchor: { path: [0, 0, 1, 0, 0], offset: 0 },
        focus: { path: [0, 1, 1, 1, 0], offset: 2 },
      },
    ])
      expect(getClipboardHtml(document, selection)).toBeUndefined();
  });

  it("exports nested siblings at their own root without leaking ancestor text", () => {
    const document = createDocument([
      createBulletList([createListItem([createText("未选父项")], nested())]),
    ]);
    const html = getClipboardHtml(document, {
      anchor: { path: [0, 0, 1, 0, 0], offset: 1 },
      focus: { path: [0, 0, 1, 1, 0], offset: 2 },
    })!;
    expect(parseHtml(html)?.blocks).toEqual([
      createBulletList([
        createListItem([createText("甲")]),
        createListItem([createText("子乙")]),
      ]),
    ]);
    expect(html).not.toContain("未选父项");
  });

  it("keeps selected item separators as empty boundary entries", () => {
    const document = createDocument([
      createBulletList([
        createListItem([createText("甲")]),
        createListItem([createText("乙")]),
      ]),
    ]);
    const selection = {
      anchor: { path: [0, 0, 0], offset: 1 },
      focus: { path: [0, 1, 0], offset: 0 },
    };
    expect(getClipboardText(document, selection)).toBe("\n");
    expect(parseHtml(getClipboardHtml(document, selection)!)?.blocks).toEqual([
      createBulletList([createListItem(), createListItem()]),
    ]);
  });

  it("uses existing escaping and link/style sanitizers within selected list entries", () => {
    const node: TextNode = {
      type: "text",
      text: "<script>x</script>",
      marks: {
        link: { href: "javascript:alert(1)" },
        textColor: "red;position:fixed",
        bold: true,
      },
    };
    const document = createDocument([
      createBulletList([createListItem([node]), createListItem([createText("末项")])]),
    ]);
    const html = getClipboardHtml(document, {
      anchor: { path: [0, 0, 0], offset: 0 },
      focus: { path: [0, 1, 0], offset: 2 },
    })!;
    expect(html).toContain("&lt;script&gt;x&lt;/script&gt;");
    expect(html).not.toMatch(/<script|javascript:|position:|data-|aria-/);
  });

  it("does not silently renumber an overflowing ordered selection", () => {
    const document = createDocument([
      createOrderedList(
        [
          createListItem(),
          createListItem([createText("甲")]),
          createListItem([createText("乙")]),
        ],
        Number.MAX_SAFE_INTEGER,
      ),
    ]);
    expect(
      getClipboardHtml(document, {
        anchor: { path: [0, 1, 0], offset: 0 },
        focus: { path: [0, 2, 0], offset: 1 },
      }),
    ).toBeUndefined();
  });
});

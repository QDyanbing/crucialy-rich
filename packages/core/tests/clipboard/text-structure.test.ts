import { describe, expect, it } from "vitest";
import {
  createBulletList,
  createCodeBlock,
  createDivider,
  createDocument,
  createImage,
  createListItem,
  createParagraph,
  createTable,
  createText,
  type Point,
} from "../../src";
import { getClipboardText } from "../../src/clipboard/text";

describe("plain clipboard text structure", () => {
  it("joins marked nodes without exporting HTML or model attributes", () => {
    const value = createDocument([
      createParagraph([
        createText("甲", { bold: true }),
        createText("<乙>", { link: { href: "https://example.com" } }),
      ]),
    ]);
    expect(
      getClipboardText(value, {
        anchor: { path: [0, 0], offset: 0 },
        focus: { path: [0, 1], offset: 3 },
      }),
    ).toBe("甲<乙>");
  });

  it("keeps paragraph boundaries, empty lines and literal code text", () => {
    const value = createDocument([
      createParagraph([createText("前")]),
      createParagraph(),
      createCodeBlock([createText("  <b>\n\t后")]),
    ]);
    expect(
      getClipboardText(value, {
        anchor: { path: [0, 0], offset: 0 },
        focus: { path: [2, 0], offset: 8 },
      }),
    ).toBe("前\n\n  <b>\n\t后");
  });

  it("reads nested lists as lines without bullet or checkbox decoration", () => {
    const value = createDocument([
      createBulletList([
        createListItem(
          [createText("父")],
          createBulletList([createListItem([createText("子")])]),
        ),
        createListItem([createText("邻")]),
      ]),
    ]);
    expect(
      getClipboardText(value, {
        anchor: { path: [0, 0, 0], offset: 0 },
        focus: { path: [0, 1, 0], offset: 1 },
      }),
    ).toBe("父\n子\n邻");
  });

  it.each([false, true])(
    "keeps table tabs and row/cell paragraph newlines (backward: %s)",
    (backward) => {
      const table = createTable(2, 2);
      table.children[0]!.children[0]!.children = [
        createParagraph([createText("甲")]),
        createParagraph([createText("续")]),
      ];
      table.children[0]!.children[1]!.children = [createParagraph([createText("乙")])];
      table.children[1]!.children[1]!.children = [createParagraph([createText("丁")])];
      const start: Point = { path: [0, 0, 0, 0, 0], offset: 0 };
      const end: Point = { path: [0, 1, 1, 0, 0], offset: 1 };
      expect(
        getClipboardText(
          createDocument([table]),
          backward ? { anchor: end, focus: start } : { anchor: start, focus: end },
        ),
      ).toBe("甲\n续\t乙\n\t丁");
    },
  );

  it("omits void content and URLs but keeps block separators", () => {
    const value = createDocument([
      createParagraph([createText("前")]),
      createDivider(),
      createImage("https://example.com/a.png", { alt: "秘密描述" }),
      createParagraph([createText("后")]),
    ]);
    expect(
      getClipboardText(value, {
        anchor: { path: [0, 0], offset: 0 },
        focus: { path: [3, 0], offset: 1 },
      }),
    ).toBe("前\n\n\n后");
  });

  it("does not claim visually empty ranges between adjacent text nodes", () => {
    const value = createDocument([
      createParagraph([createText("甲", { bold: true }), createText("乙")]),
    ]);
    expect(
      getClipboardText(value, {
        anchor: { path: [0, 0], offset: 1 },
        focus: { path: [0, 1], offset: 0 },
      }),
    ).toBeUndefined();
  });
});

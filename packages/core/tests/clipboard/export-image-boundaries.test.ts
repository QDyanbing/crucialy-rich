import { describe, expect, it } from "vitest";
import {
  createBulletList,
  createDocument,
  createImage,
  createListItem,
  createParagraph,
  createTable,
  createText,
  getClipboardHtml,
  getClipboardText,
  parseHtml,
} from "../../src";

describe("enclosed image clipboard range boundaries", () => {
  it.each([false, true])(
    "exports consecutive images but ignores unsupported unselected images (%s)",
    (backward) => {
      const first = createImage("https://example.com/first.png", { alt: "首图" });
      const second = createImage("http://example.com/second.png", {
        alt: "次图",
        width: 120,
      });
      const document = createDocument([
        createImage("blob:https://example.com/unselected"),
        createParagraph([createText("前甲")]),
        first,
        second,
        createParagraph([createText("乙后")]),
        createImage("https://user:secret@example.com/unselected.png"),
      ]);
      const before = structuredClone(document);
      const anchor = { path: [1, 0], offset: 1 };
      const focus = { path: [4, 0], offset: 1 };
      const html = getClipboardHtml(
        document,
        backward ? { anchor: focus, focus: anchor } : { anchor, focus },
      )!;
      const blocks = parseHtml(html)!.blocks;
      expect(blocks).toEqual([
        createParagraph([createText("甲")]),
        first,
        second,
        createParagraph([createText("乙")]),
      ]);
      expect(html).not.toMatch(/unselected|secret|blob:/);
      if (blocks[1]?.type === "image") blocks[1].alt = "修改";
      expect(document).toEqual(before);
    },
  );

  it.each(["loading", "error"] as const)(
    "does not drop a %s image after a supported one",
    (status) => {
      const document = createDocument([
        createParagraph(),
        createImage("https://example.com/ready.png"),
        createImage("https://example.com/pending.png", { status }),
        createParagraph(),
      ]);
      const selection = {
        anchor: { path: [0, 0], offset: 0 },
        focus: { path: [3, 0], offset: 0 },
      };
      expect(getClipboardText(document, selection)).toBe("\n\n\n");
      expect(getClipboardHtml(document, selection)).toBeUndefined();
    },
  );

  it("refuses invalid image metadata without removing other selected structures", () => {
    const document = createDocument([
      createParagraph(),
      createTable(1, 1),
      createImage("https://example.com/a.png", { width: -1 }),
      createParagraph(),
    ]);
    expect(
      getClipboardHtml(document, {
        anchor: { path: [0, 0], offset: 0 },
        focus: { path: [3, 0], offset: 0 },
      }),
    ).toBeUndefined();
  });

  it("preserves a complete image alongside a table and list between empty boundaries", () => {
    const document = createDocument([
      createParagraph(),
      createTable(1, 1),
      createImage("https://example.com/a.png"),
      createBulletList([createListItem([createText("列表")])]),
      createParagraph(),
    ]);
    const html = getClipboardHtml(document, {
      anchor: { path: [0, 0], offset: 0 },
      focus: { path: [4, 0], offset: 0 },
    })!;
    expect(parseHtml(html)?.blocks).toEqual(document.children);
  });
});

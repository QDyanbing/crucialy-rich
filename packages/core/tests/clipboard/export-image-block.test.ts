import { describe, expect, it } from "vitest";
import {
  createBlockSelection,
  createDivider,
  createDocument,
  createImage,
  createParagraph,
  createTable,
  createText,
  getClipboardHtml,
  parseHtml,
} from "../../src";

describe("image block HTML clipboard export", () => {
  it("exports only the selected image with safe metadata and no surrounding text", () => {
    const image = createImage("https://example.com/a.png", {
      alt: '"><中文>&',
      width: 120,
      height: 80,
    });
    const document = createDocument([
      createParagraph([createText("未选正文")]),
      image,
      createImage("https://example.com/unselected.png"),
    ]);
    const before = structuredClone(document);
    const html = getClipboardHtml(document, createBlockSelection([1]))!;
    expect(parseHtml(html)?.blocks).toEqual([image]);
    expect(html).toContain("&quot;&gt;&lt;中文&gt;&amp;");
    expect(html).not.toMatch(
      /未选|unselected|data-|aria-|status=|contenteditable|class=/,
    );
    expect(document).toEqual(before);
  });

  it.each([
    createImage("blob:https://example.com/local"),
    createImage("https://example.com/a.png", { status: "loading" }),
    createImage("https://example.com/a.png", { status: "error" }),
    createImage("https://user:secret@example.com/a.png"),
    createImage("javascript:alert(1)"),
    createImage("https://example.com/a.png", { width: -1 }),
  ])("refuses unsupported selected image $src ($status)", (image) => {
    expect(
      getClipboardHtml(createDocument([image]), createBlockSelection([0])),
    ).toBeUndefined();
  });

  it.each([[], [-1], [9], [0, 0]].map((path) => ({ path })))(
    "refuses an invalid block path $path",
    ({ path }) => {
      expect(
        getClipboardHtml(
          createDocument([createImage("https://example.com/a.png")]),
          createBlockSelection(path),
        ),
      ).toBeUndefined();
    },
  );

  it.each([createParagraph(), createDivider(), createTable(1, 1)])(
    "does not expand block export to $type",
    (block) => {
      expect(
        getClipboardHtml(createDocument([block]), createBlockSelection([0])),
      ).toBeUndefined();
    },
  );

  it("reuses dimension omission and normalization for selected images", () => {
    const image = createImage("  HTTPS://EXAMPLE.com/a.png  ", {
      width: 120.5,
      height: 80,
    });
    expect(
      parseHtml(getClipboardHtml(createDocument([image]), createBlockSelection([0]))!)
        ?.blocks,
    ).toEqual([createImage("https://example.com/a.png", { height: 80 })]);
  });
});

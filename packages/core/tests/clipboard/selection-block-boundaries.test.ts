import { describe, expect, it } from "vitest";
import {
  createBulletList,
  createDivider,
  createDocument,
  createListItem,
  createParagraph,
  createTable,
  createText,
  type RangeSelection,
} from "../../src";
import { getClipboardTextBlocks } from "../../src/clipboard/selection-blocks";

describe("clipboard text block boundaries", () => {
  it("exports nested list item text as a paragraph without its siblings or nested list", () => {
    const document = createDocument([
      createBulletList([
        createListItem(
          [createText("父")],
          createBulletList([
            createListItem(
              [createText("前文字后", { bold: true })],
              createBulletList([createListItem([createText("不能泄露")])]),
            ),
            createListItem([createText("邻项")]),
          ]),
        ),
      ]),
    ]);
    expect(
      getClipboardTextBlocks(document, {
        anchor: { path: [0, 0, 1, 0, 0], offset: 1 },
        focus: { path: [0, 0, 1, 0, 0], offset: 3 },
      }),
    ).toEqual([createParagraph([createText("文字", { bold: true })])]);
  });

  it.each([false, true])(
    "clips paragraphs in one cell without neighbors (backward: %s)",
    (backward) => {
      const table = createTable(1, 2);
      table.children[0]!.children[0]!.children = [
        createParagraph([createText("前甲")]),
        createParagraph(),
        createParagraph([createText("乙后", { italic: true })]),
      ];
      const selection: RangeSelection = {
        anchor: { path: [0, 0, 0, 0, 0], offset: 1 },
        focus: { path: [0, 0, 0, 2, 0], offset: 1 },
      };
      expect(
        getClipboardTextBlocks(
          createDocument([table]),
          backward ? { anchor: selection.focus, focus: selection.anchor } : selection,
        ),
      ).toEqual([
        createParagraph([createText("甲")]),
        createParagraph(),
        createParagraph([createText("乙", { italic: true })]),
      ]);
    },
  );

  it("rejects cross-cell selection instead of partially exporting it", () => {
    const table = createTable(1, 2);
    for (const cell of table.children[0]!.children)
      cell.children = [createParagraph([createText("文字")])];
    expect(
      getClipboardTextBlocks(createDocument([table]), {
        anchor: { path: [0, 0, 0, 0, 0], offset: 0 },
        focus: { path: [0, 0, 1, 0, 0], offset: 1 },
      }),
    ).toBeUndefined();
  });

  it("rejects cross-item and parent-to-nested selections", () => {
    const document = createDocument([
      createBulletList([
        createListItem(
          [createText("父")],
          createBulletList([createListItem([createText("子")])]),
        ),
        createListItem([createText("邻")]),
      ]),
    ]);
    for (const path of [
      [0, 1, 0],
      [0, 0, 1, 0, 0],
    ]) {
      expect(
        getClipboardTextBlocks(document, {
          anchor: { path: [0, 0, 0], offset: 0 },
          focus: { path, offset: 1 },
        }),
      ).toBeUndefined();
    }
  });

  it("rejects top-level ranges through void or list blocks", () => {
    for (const block of [
      createDivider(),
      createBulletList([createListItem([createText("列表")])]),
    ]) {
      const document = createDocument([
        createParagraph([createText("前")]),
        block,
        createParagraph([createText("后")]),
      ]);
      expect(
        getClipboardTextBlocks(document, {
          anchor: { path: [0, 0], offset: 0 },
          focus: { path: [2, 0], offset: 1 },
        }),
      ).toBeUndefined();
    }
  });
});

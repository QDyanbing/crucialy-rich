import { describe, expect, it } from "vitest";
import {
  createDivider,
  createDocument,
  createOrderedList,
  createListItem,
  createParagraph,
  createTable,
  createText,
} from "../../src";
import { getClipboardBlockFragment } from "../../src/clipboard/selection-fragment";

describe("mixed top-level clipboard fragments", () => {
  it.each([false, true])(
    "clips text boundaries and clones complete structures (%s)",
    (backward) => {
      const list = createOrderedList(
        [createListItem([createText("列表", { bold: true })])],
        4,
      );
      const table = createTable(1, 1);
      table.children[0]!.children[0]!.children = [
        createParagraph([createText("单元格")]),
      ];
      const document = createDocument([
        createParagraph([createText("未选前段")]),
        createParagraph([createText("前甲", { italic: true })]),
        list,
        createDivider(),
        table,
        createParagraph([createText("乙后")]),
        createParagraph([createText("未选后段")]),
      ]);
      const before = structuredClone(document);
      const anchor = { path: [1, 0], offset: 1 };
      const focus = { path: [5, 0], offset: 1 };
      const fragment = getClipboardBlockFragment(
        document,
        backward ? { anchor: focus, focus: anchor } : { anchor, focus },
      )!;
      expect(fragment).toEqual([
        createParagraph([createText("甲", { italic: true })]),
        list,
        createDivider(),
        table,
        createParagraph([createText("乙")]),
      ]);
      expect(fragment[1]).not.toBe(list);
      expect(fragment[3]).not.toBe(table);
      if (fragment[1]?.type === "orderedList")
        fragment[1].children[0]!.children[0]!.text = "修改";
      if (fragment[3]?.type === "table")
        fragment[3].children[0]!.children[0]!.children[0]!.children[0]!.text = "修改";
      expect(document).toEqual(before);
    },
  );

  it("preserves empty boundary paragraphs around a divider", () => {
    const document = createDocument([
      createParagraph([createText("前")]),
      createDivider(),
      createParagraph([createText("后")]),
    ]);
    expect(
      getClipboardBlockFragment(document, {
        anchor: { path: [0, 0], offset: 1 },
        focus: { path: [2, 0], offset: 0 },
      }),
    ).toEqual([createParagraph(), createDivider(), createParagraph()]);
  });

  it("leaves text-only ranges with the existing text block exporter", () => {
    const document = createDocument([
      createParagraph([createText("甲")]),
      createParagraph([createText("乙")]),
    ]);
    expect(
      getClipboardBlockFragment(document, {
        anchor: { path: [0, 0], offset: 0 },
        focus: { path: [1, 0], offset: 1 },
      }),
    ).toBeUndefined();
  });
});

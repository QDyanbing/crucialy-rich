import { describe, expect, it } from "vitest";
import { createDocument, createParagraph, createTable, createText } from "../../src";
import { getClipboardTable } from "../../src/clipboard/selection-table";

describe("same-row clipboard table fragments", () => {
  it.each([false, true])(
    "clips cell paragraphs in either direction (%s)",
    (backward) => {
      const table = createTable(2, 4);
      table.children[0]!.children[1]!.children = [
        createParagraph([createText("未选段")]),
        createParagraph([createText("前甲", { bold: true })]),
        createParagraph([createText("续段")]),
      ];
      table.children[0]!.children[2]!.children = [
        createParagraph([createText("乙后", { italic: true })]),
        createParagraph([createText("未选后段")]),
      ];
      const document = createDocument([table]);
      const before = structuredClone(document);
      const anchor = { path: [0, 0, 1, 1, 0], offset: 1 };
      const focus = { path: [0, 0, 2, 0, 0], offset: 1 };
      const fragment = getClipboardTable(
        document,
        backward ? { anchor: focus, focus: anchor } : { anchor, focus },
      )!;
      expect(fragment.children).toHaveLength(1);
      expect(fragment.children[0]!.children.map((cell) => cell.children)).toEqual([
        [
          createParagraph([createText("甲", { bold: true })]),
          createParagraph([createText("续段")]),
        ],
        [createParagraph([createText("乙", { italic: true })])],
      ]);
      fragment.children[0]!.children[0]!.children[0]!.children[0]!.text = "修改";
      expect(document).toEqual(before);
    },
  );

  it("leaves single-cell selections to the existing paragraph exporter", () => {
    const document = createDocument([createTable(1, 2)]);
    expect(
      getClipboardTable(document, {
        anchor: { path: [0, 0, 0, 0, 0], offset: 0 },
        focus: { path: [0, 0, 0, 0, 0], offset: 0 },
      }),
    ).toBeUndefined();
  });
});

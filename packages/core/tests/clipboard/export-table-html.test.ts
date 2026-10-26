import { describe, expect, it } from "vitest";
import {
  createDocument,
  createParagraph,
  createTable,
  createText,
  getClipboardHtml,
  getClipboardText,
  parseHtml,
} from "../../src";

describe("table HTML clipboard export", () => {
  it("round trips only selected same-row cells and clipped paragraphs", () => {
    const table = createTable(2, 4);
    table.children[0]!.children[1]!.children = [
      createParagraph([createText("未选前段")]),
      createParagraph([createText("前甲", { bold: true })]),
      createParagraph(),
      createParagraph([createText("续段")]),
    ];
    table.children[0]!.children[2]!.children = [
      createParagraph([createText("乙后", { italic: true })]),
      createParagraph([createText("未选后段")]),
    ];
    const document = createDocument([table]);
    const selection = {
      anchor: { path: [0, 0, 1, 1, 0], offset: 1 },
      focus: { path: [0, 0, 2, 0, 0], offset: 1 },
    };
    const expected = createTable(1, 2);
    expected.children[0]!.children[0]!.children = [
      createParagraph([createText("甲", { bold: true })]),
      createParagraph(),
      createParagraph([createText("续段")]),
    ];
    expected.children[0]!.children[1]!.children = [
      createParagraph([createText("乙", { italic: true })]),
    ];
    const html = getClipboardHtml(document, selection)!;
    expect(getClipboardText(document, selection)).toBe("甲\n\n续段\t乙");
    expect(parseHtml(html)?.blocks).toEqual([expected]);
    expect(html).toContain("<table><tbody><tr><td>");
    expect(html).not.toMatch(/未选|data-|aria-|contenteditable|class=/i);
  });

  it("exports complete rows without adjacent rows", () => {
    const table = createTable(4, 2);
    for (const [rowIndex, row] of table.children.entries())
      for (const [column, cell] of row.children.entries())
        cell.children = [createParagraph([createText(`${rowIndex}:${column}`)])];
    const html = getClipboardHtml(createDocument([table]), {
      anchor: { path: [0, 1, 0, 0, 0], offset: 0 },
      focus: { path: [0, 2, 1, 0, 0], offset: 3 },
    })!;
    expect(parseHtml(html)?.blocks).toEqual([
      { type: "table", children: table.children.slice(1, 3) },
    ]);
    expect(html).not.toMatch(/0:|3:/);
  });

  it("keeps single-cell excerpts as paragraphs without a table shell", () => {
    const table = createTable(1, 1);
    table.children[0]!.children[0]!.children = [
      createParagraph([createText("甲", { bold: true })]),
      createParagraph([createText("乙")]),
    ];
    const html = getClipboardHtml(createDocument([table]), {
      anchor: { path: [0, 0, 0, 0, 0], offset: 0 },
      focus: { path: [0, 0, 0, 1, 0], offset: 1 },
    })!;
    expect(parseHtml(html)?.blocks).toEqual(table.children[0]!.children[0]!.children);
    expect(html).not.toContain("<table");
  });
});

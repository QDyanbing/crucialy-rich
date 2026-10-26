import { describe, expect, it } from "vitest";
import { createDocument, createParagraph, createTable, createText } from "../../src";
import { getClipboardTable } from "../../src/clipboard/selection-table";

describe("complete-row clipboard table fragments", () => {
  const table = createTable(4, 2);
  for (const [rowIndex, row] of table.children.entries())
    for (const [column, cell] of row.children.entries())
      cell.children = [createParagraph([createText(`${rowIndex}:${column}`)])];
  const anchor = { path: [0, 1, 0, 0, 0], offset: 0 };
  const focus = { path: [0, 2, 1, 0, 0], offset: 3 };

  it.each([false, true])("exports only complete selected rows (%s)", (backward) => {
    const document = createDocument([table]);
    const before = structuredClone(document);
    const fragment = getClipboardTable(
      document,
      backward ? { anchor: focus, focus: anchor } : { anchor, focus },
    )!;
    expect(fragment.children).toEqual(table.children.slice(1, 3));
    fragment.children[0]!.children[0]!.children[0]!.children[0]!.text = "修改";
    expect(document).toEqual(before);
  });

  it.each([
    { anchor: { ...anchor, offset: 1 }, focus },
    { anchor: { ...anchor, path: [0, 1, 1, 0, 0] }, focus },
    { anchor, focus: { ...focus, offset: 2 } },
    { anchor, focus: { ...focus, path: [0, 2, 0, 0, 0] } },
  ])("refuses partial multi-row ranges: %j", (selection) => {
    expect(getClipboardTable(createDocument([table]), selection)).toBeUndefined();
  });

  it("supports one-column tables and trailing empty paragraphs", () => {
    const table = createTable(2, 1);
    table.children[0]!.children[0]!.children = [createParagraph([createText("甲")])];
    table.children[1]!.children[0]!.children = [
      createParagraph([createText("乙")]),
      createParagraph(),
    ];
    expect(
      getClipboardTable(createDocument([table]), {
        anchor: { path: [0, 0, 0, 0, 0], offset: 0 },
        focus: { path: [0, 1, 0, 1, 0], offset: 0 },
      }),
    ).toEqual(table);
  });
});

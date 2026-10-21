import { describe, expect, it } from "vitest";
import {
  createDocument,
  createParagraph,
  createTable,
  createText,
  getAdjacentCellSelection,
  type CellNavigationDirection,
} from "../../src";

function range(path: number[], offset = 0) {
  return { anchor: { path, offset }, focus: { path: [...path], offset } };
}

describe("cell navigation boundaries", () => {
  it.each([
    { path: [0, 0], offset: 0 },
    { path: [0, 0, 0, 0, 0], offset: -1 },
    { path: [0, 0, 0, 0, 0], offset: 1 },
    { path: [0, 0, 3, 0, 0], offset: 0 },
    { path: [0, 0, 0, 0, 0], offset: NaN },
  ])("rejects invalid source $path at $offset", ({ path, offset }) => {
    expect(
      getAdjacentCellSelection(
        createDocument([createTable(1, 2)]),
        range(path, offset),
      ),
    ).toBeUndefined();
  });

  it("rejects a selection crossing cells or tables", () => {
    const document = createDocument([createTable(1, 2), createTable(1, 2)]);
    const anchor = { path: [0, 0, 0, 0, 0], offset: 0 };
    for (const path of [
      [0, 0, 1, 0, 0],
      [1, 0, 0, 0, 0],
    ]) {
      expect(
        getAdjacentCellSelection(document, { anchor, focus: { path, offset: 0 } }),
      ).toBeUndefined();
    }
  });

  it("collapses a same-cell multi-paragraph range to the adjacent cell start", () => {
    const table = createTable(1, 2);
    table.children[0]!.children[0]!.children = [
      createParagraph([createText("第一段", { bold: true })]),
      createParagraph([createText("第二段")]),
    ];
    const document = createDocument([table]);
    const anchor = { path: [0, 0, 0, 0, 0], offset: 1 };
    const focus = { path: [0, 0, 0, 1, 0], offset: 2 };
    for (const selection of [
      { anchor, focus },
      { anchor: focus, focus: anchor },
    ]) {
      expect(getAdjacentCellSelection(document, selection)).toEqual(
        range([0, 0, 1, 0, 0]),
      );
    }
    expect(table.children[0]!.children[0]!.children).toHaveLength(2);
  });

  it("does not cross neighboring tables at their edges", () => {
    const document = createDocument([createTable(1, 1), createTable(1, 1)]);
    expect(getAdjacentCellSelection(document, range([0, 0, 0, 0, 0]))).toBeUndefined();
    expect(
      getAdjacentCellSelection(document, range([1, 0, 0, 0, 0]), "previous"),
    ).toBeUndefined();
  });

  it("returns detached anchor and focus without mutating input", () => {
    const document = createDocument([createTable(1, 2)]);
    const selection = range([0, 0, 0, 0, 0]);
    const before = JSON.stringify({ document, selection });
    const result = getAdjacentCellSelection(document, selection)!;
    result.anchor.path[0] = 9;
    expect(result.focus.path).toEqual([0, 0, 1, 0, 0]);
    expect(JSON.stringify({ document, selection })).toBe(before);
  });

  it("rejects ragged tables, invalid destination text and invalid runtime directions", () => {
    const table = createTable(2, 2);
    table.children[1]!.children.pop();
    expect(
      getAdjacentCellSelection(createDocument([table]), range([0, 0, 0, 0, 0])),
    ).toBeUndefined();
    const valid = createTable(1, 2);
    valid.children[0]!.children[1]!.children[0]!.children = [];
    expect(
      getAdjacentCellSelection(createDocument([valid]), range([0, 0, 0, 0, 0])),
    ).toBeUndefined();
    expect(
      getAdjacentCellSelection(
        createDocument([createTable(1, 2)]),
        range([0, 0, 0, 0, 0]),
        "bad" as CellNavigationDirection,
      ),
    ).toBeUndefined();
  });
});

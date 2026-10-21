import { describe, expect, it } from "vitest";
import {
  createDocument,
  createTable,
  getAdjacentCellSelection,
  isValidPoint,
  type CellNavigationDirection,
} from "../../src";

const document = createDocument([createTable(2, 3)]);
function range(row: number, column: number) {
  const point = { path: [0, row, column, 0, 0], offset: 0 };
  return { anchor: point, focus: { ...point, path: [...point.path] } };
}

describe("adjacent cell selection", () => {
  it.each<{
    from: [number, number];
    to: [number, number];
    direction: CellNavigationDirection;
  }>([
    { from: [0, 0], to: [0, 1], direction: "next" },
    { from: [0, 2], to: [1, 0], direction: "next" },
    { from: [1, 1], to: [1, 0], direction: "previous" },
    { from: [1, 0], to: [0, 2], direction: "previous" },
  ])("moves $direction from $from to $to", ({ from, to, direction }) => {
    const next = getAdjacentCellSelection(document, range(...from), direction);
    expect(next).toEqual(range(...to));
    expect(isValidPoint(document, next!.anchor)).toBe(true);
  });

  it("defaults to the next cell", () => {
    expect(getAdjacentCellSelection(document, range(0, 0))).toEqual(range(0, 1));
  });

  it("does not wrap past either end or create rows", () => {
    expect(getAdjacentCellSelection(document, range(0, 0), "previous")).toBeUndefined();
    expect(getAdjacentCellSelection(document, range(1, 2))).toBeUndefined();
    expect(document.children[0]).toEqual(createTable(2, 3));
  });
});

import { describe, expect, it } from "vitest";

import {
  cloneCellSelection,
  createCellSelection,
  createDocument,
  createTable,
  getCellPathFromPoint,
  getCellSelectionFromRange,
  isRangeInSameCell,
  isValidCellSelection,
} from "../../src";

describe("cell selection", () => {
  it("creates and clones detached cell paths", () => {
    const path = [0, 1, 2];
    const selection = createCellSelection(path);
    const cloned = cloneCellSelection(selection);

    path[0] = 9;
    selection.path[1] = 9;

    expect(cloned).toEqual({ path: [0, 1, 2], type: "cell" });
    expect(cloned.path).not.toBe(selection.path);
  });

  it("validates only paths that reference table cells", () => {
    const document = createDocument([createTable(2, 3)]);

    expect(isValidCellSelection(document, createCellSelection([0, 1, 2]))).toBe(true);
    expect(isValidCellSelection(document, createCellSelection([0, 1]))).toBe(false);
    expect(isValidCellSelection(document, createCellSelection([0, 1, 3]))).toBe(false);
  });

  it("locates the current cell from a text point", () => {
    const document = createDocument([createTable(2, 2)]);

    expect(
      getCellPathFromPoint(document, { offset: 0, path: [0, 1, 1, 0, 0] }),
    ).toEqual([0, 1, 1]);
    expect(getCellPathFromPoint(document, { offset: 0, path: [0, 0] })).toBeUndefined();
  });

  it("recognizes ranges contained in one cell", () => {
    const document = createDocument([createTable(1, 2)]);
    const sameCell = {
      anchor: { offset: 0, path: [0, 0, 1, 0, 0] },
      focus: { offset: 0, path: [0, 0, 1, 0, 0] },
    };
    const crossCell = {
      anchor: { offset: 0, path: [0, 0, 0, 0, 0] },
      focus: { offset: 0, path: [0, 0, 1, 0, 0] },
    };

    expect(getCellSelectionFromRange(document, sameCell)).toEqual({
      path: [0, 0, 1],
      type: "cell",
    });
    expect(isRangeInSameCell(document, sameCell)).toBe(true);
    expect(getCellSelectionFromRange(document, crossCell)).toBeUndefined();
    expect(isRangeInSameCell(document, crossCell)).toBe(false);
  });
});

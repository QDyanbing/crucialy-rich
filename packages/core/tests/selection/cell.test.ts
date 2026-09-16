import { describe, expect, it } from "vitest";

import {
  cloneCellSelection,
  createCellSelection,
  createDocument,
  createTable,
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
});

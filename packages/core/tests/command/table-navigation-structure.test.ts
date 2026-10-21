import { describe, expect, it } from "vitest";
import {
  addColumnAfterCommand,
  addRowAfterCommand,
  applyTransaction,
  createDocument,
  createParagraph,
  createTable,
  deleteColumnCommand,
  deleteRowCommand,
  getAdjacentCellSelection,
  isValidPoint,
  validateDocument,
} from "../../src";

function range(row: number, column: number) {
  const point = { path: [1, row, column, 0, 0], offset: 0 };
  return { anchor: point, focus: { ...point, path: [...point.path] } };
}

describe("navigation after table structure changes", () => {
  it("visits an appended row rather than treating the old last cell as the boundary", () => {
    const document = createDocument([createParagraph(), createTable(2, 2)]);
    const result = addRowAfterCommand.execute({
      context: { document },
      payload: { path: [1], rowIndex: 1 },
    });
    const after = applyTransaction(document, result.transaction!);
    expect(getAdjacentCellSelection(document, range(1, 1))).toBeUndefined();
    const next = getAdjacentCellSelection(after, range(1, 1));
    expect(next).toEqual(range(2, 0));
    expect(isValidPoint(after, next!.anchor)).toBe(true);
  });

  it("uses updated column counts for both directions and row wrap", () => {
    const document = createDocument([createParagraph(), createTable(2, 2)]);
    const result = addColumnAfterCommand.execute({
      context: { document },
      payload: { path: [1], columnIndex: 0 },
    });
    const after = applyTransaction(document, result.transaction!);
    expect(getAdjacentCellSelection(after, range(0, 1))).toEqual(range(0, 2));
    expect(getAdjacentCellSelection(after, range(0, 2))).toEqual(range(1, 0));
    expect(getAdjacentCellSelection(after, range(1, 0), "previous")).toEqual(
      range(0, 2),
    );
    expect(validateDocument(after).valid).toBe(true);
  });

  it("does not navigate to a deleted row or stale source point", () => {
    const document = createDocument([createParagraph(), createTable(2, 2)]);
    const result = deleteRowCommand.execute({
      context: { document },
      payload: { path: [1], rowIndex: 1 },
    });
    const after = applyTransaction(document, result.transaction!);
    expect(getAdjacentCellSelection(after, range(0, 1))).toBeUndefined();
    expect(getAdjacentCellSelection(after, range(1, 0), "previous")).toBeUndefined();
  });

  it("wraps correctly after column deletion and refuses a removed table", () => {
    const document = createDocument([createParagraph(), createTable(2, 3)]);
    const result = deleteColumnCommand.execute({
      context: { document },
      payload: { path: [1], columnIndex: 1 },
    });
    const after = applyTransaction(document, result.transaction!);
    expect(getAdjacentCellSelection(after, range(0, 1))).toEqual(range(1, 0));
    expect(getAdjacentCellSelection(after, range(0, 2))).toBeUndefined();
    const single = createDocument([createParagraph(), createTable(1, 1)]);
    const removed = deleteRowCommand.execute({
      context: { document: single },
      payload: { path: [1], rowIndex: 0 },
    });
    expect(
      getAdjacentCellSelection(
        applyTransaction(single, removed.transaction!),
        range(0, 0),
      ),
    ).toBeUndefined();
  });
});

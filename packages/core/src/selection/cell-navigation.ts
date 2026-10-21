import { isTableNode, type DocumentNode } from "../model";
import { getCellSelectionFromRange } from "./cell";
import { isValidPoint } from "./point";
import type { RangeSelection } from "./types";

export type CellNavigationDirection = "next" | "previous";

export function getAdjacentCellSelection(
  document: DocumentNode,
  selection: RangeSelection,
  direction: CellNavigationDirection = "next",
): RangeSelection | undefined {
  const cell = getCellSelectionFromRange(document, selection);
  const [blockIndex, rowIndex, columnIndex] = cell?.path ?? [];
  const table = blockIndex === undefined ? undefined : document.children[blockIndex];

  if (
    !isTableNode(table) ||
    blockIndex === undefined ||
    rowIndex === undefined ||
    columnIndex === undefined ||
    (direction !== "next" && direction !== "previous")
  ) {
    return undefined;
  }

  const columns = table.children[0]?.children.length ?? 0;
  if (columns === 0 || table.children.some((row) => row.children.length !== columns)) {
    return undefined;
  }

  const nextIndex = rowIndex * columns + columnIndex + (direction === "next" ? 1 : -1);
  if (nextIndex < 0 || nextIndex >= table.children.length * columns) {
    return undefined;
  }

  const point = {
    path: [blockIndex, Math.floor(nextIndex / columns), nextIndex % columns, 0, 0],
    offset: 0,
  };

  return isValidPoint(document, point)
    ? { anchor: point, focus: { path: [...point.path], offset: 0 } }
    : undefined;
}

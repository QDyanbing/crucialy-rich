import { isTableCellNode, type DocumentNode } from "../model";
import { getNodeAtPath } from "./path";
import { isValidPoint } from "./point";
import type { CellSelection, Path, Point, RangeSelection } from "./types";

function arePathsEqual(left: Path, right: Path): boolean {
  return (
    left.length === right.length && left.every((part, index) => part === right[index])
  );
}

export function createCellSelection(path: Path): CellSelection {
  return { path: [...path], type: "cell" };
}

export function cloneCellSelection(selection: CellSelection): CellSelection {
  return createCellSelection(selection.path);
}

export function isValidCellSelection(
  document: DocumentNode,
  selection: CellSelection,
): boolean {
  return (
    selection.path.length === 3 &&
    isTableCellNode(getNodeAtPath(document, selection.path))
  );
}

export function getCellPathFromPoint(
  document: DocumentNode,
  point: Point,
): Path | undefined {
  if (!isValidPoint(document, point) || point.path.length !== 5) {
    return undefined;
  }

  const path = point.path.slice(0, 3);

  return isTableCellNode(getNodeAtPath(document, path)) ? path : undefined;
}

export function getCellSelectionFromRange(
  document: DocumentNode,
  range: RangeSelection,
): CellSelection | undefined {
  const anchorPath = getCellPathFromPoint(document, range.anchor);
  const focusPath = getCellPathFromPoint(document, range.focus);

  return anchorPath && focusPath && arePathsEqual(anchorPath, focusPath)
    ? createCellSelection(anchorPath)
    : undefined;
}

export function isRangeInSameCell(
  document: DocumentNode,
  range: RangeSelection,
): boolean {
  return getCellSelectionFromRange(document, range) !== undefined;
}

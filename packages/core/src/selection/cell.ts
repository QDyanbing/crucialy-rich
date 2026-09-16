import { isTableCellNode, type DocumentNode } from "../model";
import { getNodeAtPath } from "./path";
import type { CellSelection, Path } from "./types";

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

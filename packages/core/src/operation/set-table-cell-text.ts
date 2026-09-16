import {
  createParagraph,
  createText,
  isTableCellNode,
  isTableNode,
  type DocumentNode,
} from "../model";
import { getNodeAtPath, type Path } from "../selection";
import type { SetTableCellTextOperation } from "./types";

export function createSetTableCellTextOperation(
  path: Path,
  text: string,
): SetTableCellTextOperation {
  return { path: [...path], text, type: "set_table_cell_text" };
}

export function applySetTableCellText(
  document: DocumentNode,
  operation: SetTableCellTextOperation,
): DocumentNode {
  const [blockIndex, rowIndex, cellIndex] = operation.path;
  const cell = getNodeAtPath(document, operation.path);
  const table = blockIndex === undefined ? undefined : document.children[blockIndex];
  const row =
    rowIndex === undefined || !isTableNode(table)
      ? undefined
      : table.children[rowIndex];

  if (
    operation.path.length !== 3 ||
    blockIndex === undefined ||
    rowIndex === undefined ||
    cellIndex === undefined ||
    !isTableNode(table) ||
    !row ||
    !isTableCellNode(cell)
  ) {
    throw new RangeError("set table cell text path must reference a table cell");
  }

  const nextCell = {
    ...cell,
    children: [createParagraph([createText(operation.text)])],
  };
  const nextRow = {
    ...row,
    children: row.children.map((entry, index) =>
      index === cellIndex ? nextCell : entry,
    ),
  };
  const nextTable = {
    ...table,
    children: table.children.map((entry, index) =>
      index === rowIndex ? nextRow : entry,
    ),
  };

  return {
    ...document,
    children: document.children.map((entry, index) =>
      index === blockIndex ? nextTable : entry,
    ),
  };
}

import {
  createDocument,
  createTableCell,
  createTableRow,
  isTableNode,
  normalizeDocument,
  validateDocument,
  type DocumentNode,
  type TableNode,
} from "../model";
import { normalizeRange, type RangeSelection } from "../selection";
import { clipClipboardText } from "./selection-blocks";
import { getClipboardText } from "./text";

export function getClipboardTable(
  document: DocumentNode,
  selection: RangeSelection,
): TableNode | undefined {
  if (getClipboardText(document, selection) === undefined) return undefined;
  const range = normalizeRange(selection);
  const { anchor, focus } = range;
  if (
    anchor.path.length !== 5 ||
    focus.path.length !== 5 ||
    anchor.path[0] !== focus.path[0] ||
    anchor.path[1] !== focus.path[1] ||
    anchor.path[2] === focus.path[2]
  )
    return undefined;
  const table = document.children[anchor.path[0]!];
  if (!isTableNode(table) || !validateDocument(createDocument([table])).valid)
    return undefined;
  const rowIndex = anchor.path[1]!;
  const row = table.children[rowIndex]!;
  const start = anchor.path[2]!;
  const end = focus.path[2]!;
  const children = row.children.slice(start, end + 1).map((cell, index) => {
    const column = start + index;
    const first = column === start ? anchor.path[3]! : 0;
    const last = column === end ? focus.path[3]! : cell.children.length - 1;
    return createTableCell(
      cell.children.slice(first, last + 1).map((paragraph, paragraphIndex) => ({
        ...paragraph,
        children: clipClipboardText(
          paragraph.children,
          [anchor.path[0]!, rowIndex, column, first + paragraphIndex],
          range,
        ),
      })),
    );
  });
  return normalizeDocument(
    createDocument([{ type: "table", children: [createTableRow(children)] }]),
  ).children[0] as TableNode;
}

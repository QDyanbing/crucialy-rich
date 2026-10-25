import {
  createParagraph,
  createText,
  isListEntryNode,
  isTableCellNode,
  isTextBlockNode,
  type DocumentNode,
  type TextBlockNode,
  type TextNode,
} from "../model";
import {
  comparePoint,
  getCellSelectionFromRange,
  getNodeAtPath,
  isSameTextContainer,
  normalizeRange,
  type Path,
  type RangeSelection,
} from "../selection";
import { getClipboardText } from "./text";

function samePath(left: Path, right: Path) {
  return (
    left.length === right.length && left.every((part, index) => part === right[index])
  );
}

export function clipClipboardText(
  nodes: TextNode[],
  path: Path,
  range: RangeSelection,
): TextNode[] {
  const children = nodes.flatMap((node, index) => {
    const point = { path: [...path, index], offset: 0 };
    const start = samePath(point.path, range.anchor.path)
      ? range.anchor.offset
      : comparePoint(point, range.anchor) < 0
        ? node.text.length
        : 0;
    const end = samePath(point.path, range.focus.path)
      ? range.focus.offset
      : comparePoint(point, range.focus) > 0
        ? 0
        : node.text.length;
    return start < end ? [createText(node.text.slice(start, end), node.marks)] : [];
  });
  return children.length ? children : [createText()];
}

function clipBlock(
  block: TextBlockNode,
  path: Path,
  range: RangeSelection,
): TextBlockNode {
  return { ...block, children: clipClipboardText(block.children, path, range) };
}

export function getClipboardTextBlocks(
  document: DocumentNode,
  selection: RangeSelection,
): TextBlockNode[] | undefined {
  if (getClipboardText(document, selection) === undefined) return undefined;
  const range = normalizeRange(selection);
  if (isSameTextContainer(range.anchor, range.focus)) {
    const path = range.anchor.path.slice(0, -1);
    const container = getNodeAtPath(document, path);
    const block = isTextBlockNode(container)
      ? container
      : isListEntryNode(container)
        ? createParagraph(container.children)
        : undefined;
    return block ? [clipBlock(block, path, range)] : undefined;
  }

  const cellPath = getCellSelectionFromRange(document, range)?.path;
  if (cellPath) {
    const cell = getNodeAtPath(document, cellPath);
    if (!isTableCellNode(cell)) return undefined;
    const start = range.anchor.path[3]!;
    const end = range.focus.path[3]!;
    return cell.children
      .slice(start, end + 1)
      .map((block, index) => clipBlock(block, [...cellPath, start + index], range));
  }

  if (range.anchor.path.length !== 2 || range.focus.path.length !== 2) return undefined;
  const start = range.anchor.path[0]!;
  const end = range.focus.path[0]!;
  const blocks = document.children.slice(start, end + 1);
  if (!blocks.every(isTextBlockNode)) return undefined;
  return blocks.map((block, index) => clipBlock(block, [start + index], range));
}

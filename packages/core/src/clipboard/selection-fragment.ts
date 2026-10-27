import {
  createDocument,
  isDividerNode,
  isListNode,
  isTableNode,
  isTextBlockNode,
  normalizeDocument,
  validateDocument,
  type BlockNode,
  type DocumentNode,
} from "../model";
import { normalizeRange, type RangeSelection } from "../selection";
import { clipClipboardText } from "./selection-blocks";
import { getClipboardText } from "./text";

export function getClipboardBlockFragment(
  document: DocumentNode,
  selection: RangeSelection,
): BlockNode[] | undefined {
  if (getClipboardText(document, selection) === undefined) return undefined;
  const range = normalizeRange(selection);
  if (range.anchor.path.length !== 2 || range.focus.path.length !== 2) return undefined;
  const start = range.anchor.path[0]!;
  const end = range.focus.path[0]!;
  const blocks = document.children.slice(start, end + 1);
  if (
    !isTextBlockNode(blocks[0]) ||
    !isTextBlockNode(blocks.at(-1)) ||
    blocks.every(isTextBlockNode) ||
    !blocks.every(
      (block) =>
        isTextBlockNode(block) ||
        isListNode(block) ||
        isTableNode(block) ||
        isDividerNode(block),
    ) ||
    !validateDocument(createDocument(blocks)).valid
  )
    return undefined;
  const clipped = blocks.map((block, index) =>
    isTextBlockNode(block)
      ? {
          ...block,
          children: clipClipboardText(block.children, [start + index], range),
        }
      : block,
  );
  return normalizeDocument(createDocument(clipped)).children;
}

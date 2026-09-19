import { isTextBlockNode, type DocumentNode, type TextBlockNode } from "../model";
import {
  isCollapsed,
  isValidPoint,
  normalizeRange,
  type RangeSelection,
} from "../selection";
import type { DeleteRangeOperation } from "./types";

interface DeleteRangeTarget {
  endBlock: TextBlockNode;
  endBlockIndex: number;
  range: RangeSelection;
  startBlock: TextBlockNode;
  startBlockIndex: number;
}

export function createDeleteRangeOperation(
  range: RangeSelection,
): DeleteRangeOperation {
  return {
    range: {
      anchor: { offset: range.anchor.offset, path: [...range.anchor.path] },
      focus: { offset: range.focus.offset, path: [...range.focus.path] },
    },
    type: "delete_range",
  };
}

export function getDeleteRangeTarget(
  document: DocumentNode,
  operation: DeleteRangeOperation,
): DeleteRangeTarget | undefined {
  const range = normalizeRange(operation.range);
  const [startBlockIndex] = range.anchor.path;
  const [endBlockIndex] = range.focus.path;

  if (
    isCollapsed(range) ||
    range.anchor.path.length !== 2 ||
    range.focus.path.length !== 2 ||
    startBlockIndex === undefined ||
    endBlockIndex === undefined ||
    startBlockIndex >= endBlockIndex ||
    !isValidPoint(document, range.anchor) ||
    !isValidPoint(document, range.focus)
  ) {
    return undefined;
  }

  const blocks = document.children.slice(startBlockIndex, endBlockIndex + 1);
  const startBlock = blocks[0];
  const endBlock = blocks.at(-1);

  if (
    !isTextBlockNode(startBlock) ||
    !isTextBlockNode(endBlock) ||
    !blocks.every(isTextBlockNode)
  ) {
    return undefined;
  }

  return { endBlock, endBlockIndex, range, startBlock, startBlockIndex };
}

export function canDeleteRange(document: DocumentNode, range: RangeSelection): boolean {
  return (
    getDeleteRangeTarget(document, createDeleteRangeOperation(range)) !== undefined
  );
}

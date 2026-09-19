import {
  isTextBlockNode,
  mergeAdjacentTextNodes,
  type DocumentNode,
  type TextBlockNode,
} from "../model";
import {
  getBlockTextOffset,
  getPointAtBlockTextOffset,
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

export function applyDeleteRange(
  document: DocumentNode,
  operation: DeleteRangeOperation,
): DocumentNode {
  const target = getDeleteRangeTarget(document, operation);

  if (!target) {
    throw new RangeError(
      "delete range must cross top-level text blocks without structural nodes",
    );
  }

  const startTextIndex = target.range.anchor.path[1]!;
  const endTextIndex = target.range.focus.path[1]!;
  const startText = target.startBlock.children[startTextIndex]!;
  const endText = target.endBlock.children[endTextIndex]!;
  const prefix = startText.text.slice(0, target.range.anchor.offset);
  const suffix = endText.text.slice(target.range.focus.offset);
  const children = mergeAdjacentTextNodes([
    ...target.startBlock.children.slice(0, startTextIndex),
    ...(prefix ? [{ ...startText, text: prefix }] : []),
    ...(suffix ? [{ ...endText, text: suffix }] : []),
    ...target.endBlock.children.slice(endTextIndex + 1),
  ]);
  const mergedBlock: TextBlockNode = {
    ...target.startBlock,
    children: children.length > 0 ? children : [{ ...startText, text: "" }],
  };

  return {
    ...document,
    children: [
      ...document.children.slice(0, target.startBlockIndex),
      mergedBlock,
      ...document.children.slice(target.endBlockIndex + 1),
    ],
  };
}

export function createSelectionAfterDeleteRange(
  document: DocumentNode,
  operation: DeleteRangeOperation,
): RangeSelection {
  const target = getDeleteRangeTarget(document, operation);

  if (!target) {
    throw new RangeError(
      "delete range must cross top-level text blocks without structural nodes",
    );
  }

  const textOffset = getBlockTextOffset(document, target.range.anchor);
  const nextDocument = applyDeleteRange(document, operation);
  const point =
    textOffset === undefined
      ? undefined
      : getPointAtBlockTextOffset(nextDocument, target.startBlockIndex, textOffset, {
          affinity: "backward",
        });

  if (!point) {
    throw new RangeError("deleted block range selection could not be restored");
  }

  return {
    anchor: { offset: point.offset, path: [...point.path] },
    focus: { offset: point.offset, path: [...point.path] },
  };
}

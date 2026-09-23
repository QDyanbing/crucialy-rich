import { isTextBlockNode, type DocumentNode } from "../model";
import {
  comparePoint,
  getBlockTextOffset,
  getPointAtBlockTextOffset,
  isCollapsed,
  isValidPoint,
  normalizeRange,
  type Point,
  type RangeSelection,
} from "../selection";

export interface TextMarkCommandRange {
  blockIndex: number;
  range: RangeSelection;
}

function clonePoint(point: Point): Point {
  return { offset: point.offset, path: [...point.path] };
}

function getBlockBoundaryPoint(
  document: DocumentNode,
  blockIndex: number,
  edge: "end" | "start",
): Point | undefined {
  const block = document.children[blockIndex];

  if (!isTextBlockNode(block) || block.type === "codeBlock") {
    return undefined;
  }

  if (edge === "start") {
    return { offset: 0, path: [blockIndex, 0] };
  }

  const textIndex = block.children.length - 1;
  const text = block.children[textIndex];

  return text ? { offset: text.text.length, path: [blockIndex, textIndex] } : undefined;
}

export function getTextMarkCommandRanges(
  document: DocumentNode,
  selection: RangeSelection,
): TextMarkCommandRange[] | undefined {
  const range = normalizeRange(selection);

  if (!isValidPoint(document, range.anchor) || !isValidPoint(document, range.focus)) {
    return undefined;
  }

  const [startBlockIndex] = range.anchor.path;
  const [endBlockIndex] = range.focus.path;

  if (
    range.anchor.path.length !== 2 ||
    range.focus.path.length !== 2 ||
    startBlockIndex === undefined ||
    endBlockIndex === undefined
  ) {
    return undefined;
  }

  const ranges: TextMarkCommandRange[] = [];

  for (let blockIndex = startBlockIndex; blockIndex <= endBlockIndex; blockIndex += 1) {
    const block = document.children[blockIndex];

    if (!isTextBlockNode(block) || block.type === "codeBlock") {
      return undefined;
    }

    const anchor =
      blockIndex === startBlockIndex
        ? clonePoint(range.anchor)
        : getBlockBoundaryPoint(document, blockIndex, "start");
    const focus =
      blockIndex === endBlockIndex
        ? clonePoint(range.focus)
        : getBlockBoundaryPoint(document, blockIndex, "end");

    if (!anchor || !focus) {
      return undefined;
    }

    const blockRange = { anchor, focus };

    if (startBlockIndex === endBlockIndex || !isCollapsed(blockRange)) {
      ranges.push({ blockIndex, range: blockRange });
    }
  }

  return ranges.length > 0 ? ranges : undefined;
}

export function restoreTextMarkCommandSelection(
  document: DocumentNode,
  selection: RangeSelection,
  nextDocument: DocumentNode,
): RangeSelection | undefined {
  const anchorBlockIndex = selection.anchor.path[0];
  const focusBlockIndex = selection.focus.path[0];
  const anchorOffset = getBlockTextOffset(document, selection.anchor);
  const focusOffset = getBlockTextOffset(document, selection.focus);
  const forward = comparePoint(selection.anchor, selection.focus) <= 0;

  if (
    anchorBlockIndex === undefined ||
    focusBlockIndex === undefined ||
    anchorOffset === undefined ||
    focusOffset === undefined
  ) {
    return undefined;
  }

  const anchor = getPointAtBlockTextOffset(
    nextDocument,
    anchorBlockIndex,
    anchorOffset,
    { affinity: forward ? "forward" : "backward" },
  );
  const focus = getPointAtBlockTextOffset(nextDocument, focusBlockIndex, focusOffset, {
    affinity: forward ? "backward" : "forward",
  });

  return anchor && focus ? { anchor, focus } : undefined;
}

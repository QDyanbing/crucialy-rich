import { isListEntryNode, isTextBlockNode, type DocumentNode } from "../model";
import {
  comparePoint,
  getCellPathFromPoint,
  getNodeAtPath,
  getPointAtTextContainerOffset,
  getTextContainerPath,
  getTextContainerOffset,
  isCollapsed,
  isSameTextContainer,
  isValidPoint,
  normalizeRange,
  type Path,
  type Point,
  type RangeSelection,
} from "../selection";

export interface TextMarkCommandRange {
  blockIndex: number;
  containerPath: Path;
  range: RangeSelection;
}

function clonePoint(point: Point): Point {
  return { offset: point.offset, path: [...point.path] };
}

function arePathsEqual(left: Path, right: Path): boolean {
  return (
    left.length === right.length && left.every((part, index) => part === right[index])
  );
}

function getTextContainerBoundaryPoint(
  document: DocumentNode,
  containerPath: Path,
  edge: "end" | "start",
): Point | undefined {
  const container = getNodeAtPath(document, containerPath);

  if (!isTextBlockNode(container) || container.type === "codeBlock") {
    return undefined;
  }

  if (edge === "start") {
    return { offset: 0, path: [...containerPath, 0] };
  }

  const textIndex = container.children.length - 1;
  const text = container.children[textIndex];

  return text
    ? { offset: text.text.length, path: [...containerPath, textIndex] }
    : undefined;
}

function getTableParagraphRanges(
  document: DocumentNode,
  range: RangeSelection,
): TextMarkCommandRange[] | undefined {
  const cellPath = getCellPathFromPoint(document, range.anchor);
  const focusCellPath = getCellPathFromPoint(document, range.focus);
  const startParagraphIndex = range.anchor.path[3];
  const endParagraphIndex = range.focus.path[3];
  const blockIndex = range.anchor.path[0];

  if (
    !cellPath ||
    !focusCellPath ||
    !arePathsEqual(cellPath, focusCellPath) ||
    startParagraphIndex === undefined ||
    endParagraphIndex === undefined ||
    blockIndex === undefined
  ) {
    return undefined;
  }

  const ranges: TextMarkCommandRange[] = [];

  for (
    let paragraphIndex = startParagraphIndex;
    paragraphIndex <= endParagraphIndex;
    paragraphIndex += 1
  ) {
    const containerPath = [...cellPath, paragraphIndex];
    const anchor =
      paragraphIndex === startParagraphIndex
        ? clonePoint(range.anchor)
        : getTextContainerBoundaryPoint(document, containerPath, "start");
    const focus =
      paragraphIndex === endParagraphIndex
        ? clonePoint(range.focus)
        : getTextContainerBoundaryPoint(document, containerPath, "end");

    if (!anchor || !focus) {
      return undefined;
    }

    const paragraphRange = { anchor, focus };

    if (!isCollapsed(paragraphRange)) {
      ranges.push({ blockIndex, containerPath, range: paragraphRange });
    }
  }

  return ranges.length > 0 ? ranges : undefined;
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

  if (startBlockIndex === undefined || endBlockIndex === undefined) {
    return undefined;
  }

  if (isSameTextContainer(range.anchor, range.focus)) {
    const containerPath = getTextContainerPath(range.anchor);
    const container = containerPath
      ? getNodeAtPath(document, containerPath)
      : undefined;

    if (
      !containerPath ||
      (!isTextBlockNode(container) && !isListEntryNode(container)) ||
      container.type === "codeBlock"
    ) {
      return undefined;
    }

    return [{ blockIndex: startBlockIndex, containerPath, range }];
  }

  const tableParagraphRanges = getTableParagraphRanges(document, range);

  if (tableParagraphRanges) {
    return tableParagraphRanges;
  }

  if (range.anchor.path.length !== 2 || range.focus.path.length !== 2) {
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
        : getTextContainerBoundaryPoint(document, [blockIndex], "start");
    const focus =
      blockIndex === endBlockIndex
        ? clonePoint(range.focus)
        : getTextContainerBoundaryPoint(document, [blockIndex], "end");

    if (!anchor || !focus) {
      return undefined;
    }

    const blockRange = { anchor, focus };

    if (startBlockIndex === endBlockIndex || !isCollapsed(blockRange)) {
      ranges.push({ blockIndex, containerPath: [blockIndex], range: blockRange });
    }
  }

  return ranges.length > 0 ? ranges : undefined;
}

export function restoreTextMarkCommandSelection(
  document: DocumentNode,
  selection: RangeSelection,
  nextDocument: DocumentNode,
): RangeSelection | undefined {
  const anchorContainerPath = getTextContainerPath(selection.anchor);
  const focusContainerPath = getTextContainerPath(selection.focus);
  const anchorOffset = getTextContainerOffset(document, selection.anchor);
  const focusOffset = getTextContainerOffset(document, selection.focus);
  const forward = comparePoint(selection.anchor, selection.focus) <= 0;

  if (
    !anchorContainerPath ||
    !focusContainerPath ||
    anchorOffset === undefined ||
    focusOffset === undefined
  ) {
    return undefined;
  }

  const anchor = getPointAtTextContainerOffset(
    nextDocument,
    anchorContainerPath,
    anchorOffset,
    { affinity: forward ? "forward" : "backward" },
  );
  const focus = getPointAtTextContainerOffset(
    nextDocument,
    focusContainerPath,
    focusOffset,
    { affinity: forward ? "backward" : "forward" },
  );

  return anchor && focus ? { anchor, focus } : undefined;
}

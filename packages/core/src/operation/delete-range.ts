import {
  isParagraphNode,
  isTableCellNode,
  isTableNode,
  isTextBlockNode,
  mergeAdjacentTextNodes,
  type DocumentNode,
  type TextBlockNode,
} from "../model";
import {
  getCellSelectionFromRange,
  getNodeAtPath,
  getPointAtTextContainerOffset,
  getTextContainerOffset,
  isCollapsed,
  isValidPoint,
  normalizeRange,
  type Path,
  type RangeSelection,
} from "../selection";
import type { DeleteRangeOperation } from "./types";

interface DeleteRangeTarget {
  cellPath?: Path;
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
    !isValidPoint(document, range.anchor) ||
    !isValidPoint(document, range.focus)
  ) {
    return undefined;
  }

  const cellPath = getCellSelectionFromRange(document, range)?.path;

  if (cellPath) {
    const cell = getNodeAtPath(document, cellPath);
    const startParagraphIndex = range.anchor.path[3];
    const endParagraphIndex = range.focus.path[3];

    if (
      !isTableCellNode(cell) ||
      startParagraphIndex === undefined ||
      endParagraphIndex === undefined ||
      startParagraphIndex >= endParagraphIndex
    ) {
      return undefined;
    }

    const paragraphs = cell.children.slice(startParagraphIndex, endParagraphIndex + 1);
    const startBlock = paragraphs[0];
    const endBlock = paragraphs.at(-1);

    if (
      !isParagraphNode(startBlock) ||
      !isParagraphNode(endBlock) ||
      !paragraphs.every(isParagraphNode)
    ) {
      return undefined;
    }

    return {
      cellPath,
      endBlock,
      endBlockIndex: endParagraphIndex,
      range,
      startBlock,
      startBlockIndex: startParagraphIndex,
    };
  }

  if (
    range.anchor.path.length !== 2 ||
    range.focus.path.length !== 2 ||
    startBlockIndex === undefined ||
    endBlockIndex === undefined ||
    startBlockIndex >= endBlockIndex
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

function mergeRangeBoundaryBlocks<T extends TextBlockNode>(
  startBlock: T,
  endBlock: TextBlockNode,
  range: RangeSelection,
): T {
  const startTextIndex = range.anchor.path.at(-1)!;
  const endTextIndex = range.focus.path.at(-1)!;
  const startText = startBlock.children[startTextIndex]!;
  const endText = endBlock.children[endTextIndex]!;
  const prefix = startText.text.slice(0, range.anchor.offset);
  const suffix = endText.text.slice(range.focus.offset);
  const boundaryChildren = [
    ...startBlock.children.slice(0, startTextIndex),
    ...(prefix ? [{ ...startText, text: prefix }] : []),
    ...(suffix ? [{ ...endText, text: suffix }] : []),
    ...endBlock.children.slice(endTextIndex + 1),
  ];
  const children = mergeAdjacentTextNodes(
    startBlock.type === "codeBlock"
      ? boundaryChildren.map((text) => ({ text: text.text, type: "text" as const }))
      : boundaryChildren,
  );
  return {
    ...startBlock,
    children: children.length > 0 ? children : [{ ...startText, text: "" }],
  };
}

export function applyDeleteRange(
  document: DocumentNode,
  operation: DeleteRangeOperation,
): DocumentNode {
  const target = getDeleteRangeTarget(document, operation);

  if (!target) {
    throw new RangeError(
      "delete range must cross top-level text blocks or paragraphs in one table cell",
    );
  }

  const mergedBlock = mergeRangeBoundaryBlocks(
    target.startBlock,
    target.endBlock,
    target.range,
  );

  if (target.cellPath) {
    const [blockIndex, rowIndex, cellIndex] = target.cellPath;
    const table = blockIndex === undefined ? undefined : document.children[blockIndex];

    if (!isTableNode(table) || !isParagraphNode(mergedBlock)) {
      throw new RangeError("delete range must reference table paragraphs");
    }

    return {
      ...document,
      children: document.children.map((block, index) =>
        index === blockIndex
          ? {
              ...table,
              children: table.children.map((row, currentRowIndex) =>
                currentRowIndex === rowIndex
                  ? {
                      ...row,
                      children: row.children.map((cell, currentCellIndex) =>
                        currentCellIndex === cellIndex
                          ? {
                              ...cell,
                              children: [
                                ...cell.children.slice(0, target.startBlockIndex),
                                mergedBlock,
                                ...cell.children.slice(target.endBlockIndex + 1),
                              ],
                            }
                          : cell,
                      ),
                    }
                  : row,
              ),
            }
          : block,
      ),
    };
  }

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
      "delete range must cross top-level text blocks or paragraphs in one table cell",
    );
  }

  const textOffset = getTextContainerOffset(document, target.range.anchor);
  const nextDocument = applyDeleteRange(document, operation);
  const point =
    textOffset === undefined
      ? undefined
      : getPointAtTextContainerOffset(
          nextDocument,
          target.range.anchor.path.slice(0, -1),
          textOffset,
          { affinity: "backward" },
        );

  if (!point) {
    throw new RangeError("deleted block range selection could not be restored");
  }

  return {
    anchor: { offset: point.offset, path: [...point.path] },
    focus: { offset: point.offset, path: [...point.path] },
  };
}

import {
  createText,
  isParagraphNode,
  isTableNode,
  isTextBlockNode,
  type DocumentNode,
  type ParagraphNode,
  type TextBlockNode,
} from "../model";
import type { Point, RangeSelection } from "../selection";
import { isValidPoint } from "../selection";
import type { MergeBlockOperation } from "./types";

export function createMergeBlockOperation(point: Point): MergeBlockOperation {
  return {
    point: {
      path: [...point.path],
      offset: point.offset,
    },
    type: "merge_block",
  };
}

function getMergeBlockIndex(
  document: DocumentNode,
  operation: MergeBlockOperation,
): number {
  if (!isValidPoint(document, operation.point)) {
    throw new RangeError("merge block point must reference a text node");
  }

  const [blockIndex, textIndex] = operation.point.path;

  if (
    blockIndex === undefined ||
    textIndex !== 0 ||
    blockIndex === 0 ||
    operation.point.offset !== 0
  ) {
    throw new RangeError("merge block point must be at the start of a non-first block");
  }

  return blockIndex;
}

function isEmptyBlockChildren(children: TextBlockNode["children"]): boolean {
  return children.length === 0 || (children.length === 1 && children[0]?.text === "");
}

function mergeBlockChildren<T extends TextBlockNode["children"]>(
  previousChildren: T,
  currentChildren: T,
): T {
  const previousEmpty = isEmptyBlockChildren(previousChildren);
  const currentEmpty = isEmptyBlockChildren(currentChildren);

  if (previousEmpty && currentEmpty) {
    return [createText()] as T;
  }

  if (previousEmpty) {
    return currentChildren;
  }

  if (currentEmpty) {
    return previousChildren;
  }

  return [...previousChildren, ...currentChildren] as T;
}

interface TableParagraphMergeTarget {
  blockIndex: number;
  cellIndex: number;
  currentParagraph: ParagraphNode;
  paragraphIndex: number;
  previousParagraph: ParagraphNode;
  rowIndex: number;
}

function getTableParagraphMergeTarget(
  document: DocumentNode,
  operation: MergeBlockOperation,
): TableParagraphMergeTarget | undefined {
  if (operation.point.path.length !== 5) {
    return undefined;
  }

  const [blockIndex, rowIndex, cellIndex, paragraphIndex, textIndex] =
    operation.point.path;
  const table = blockIndex === undefined ? undefined : document.children[blockIndex];
  const row =
    rowIndex === undefined || !isTableNode(table)
      ? undefined
      : table.children[rowIndex];
  const cell = cellIndex === undefined ? undefined : row?.children[cellIndex];
  const currentParagraph =
    paragraphIndex === undefined ? undefined : cell?.children[paragraphIndex];
  const previousParagraph =
    paragraphIndex === undefined ? undefined : cell?.children[paragraphIndex - 1];

  if (
    blockIndex === undefined ||
    rowIndex === undefined ||
    cellIndex === undefined ||
    paragraphIndex === undefined ||
    paragraphIndex === 0 ||
    textIndex !== 0 ||
    operation.point.offset !== 0 ||
    !isParagraphNode(currentParagraph) ||
    !isParagraphNode(previousParagraph)
  ) {
    throw new RangeError(
      "merge block point must be at the start of a non-first table paragraph",
    );
  }

  return {
    blockIndex,
    cellIndex,
    currentParagraph,
    paragraphIndex,
    previousParagraph,
    rowIndex,
  };
}

function applyTableParagraphMerge(
  document: DocumentNode,
  target: TableParagraphMergeTarget,
): DocumentNode {
  const table = document.children[target.blockIndex];

  if (!isTableNode(table)) {
    throw new RangeError("merge block point must reference a table paragraph");
  }

  const row = table.children[target.rowIndex]!;
  const cell = row.children[target.cellIndex]!;
  const mergedParagraph = {
    ...target.previousParagraph,
    children: mergeBlockChildren(
      target.previousParagraph.children,
      target.currentParagraph.children,
    ),
  };
  const nextCell = {
    ...cell,
    children: [
      ...cell.children.slice(0, target.paragraphIndex - 1),
      mergedParagraph,
      ...cell.children.slice(target.paragraphIndex + 1),
    ],
  };
  const nextRow = {
    ...row,
    children: [
      ...row.children.slice(0, target.cellIndex),
      nextCell,
      ...row.children.slice(target.cellIndex + 1),
    ],
  };
  const nextTable = {
    ...table,
    children: [
      ...table.children.slice(0, target.rowIndex),
      nextRow,
      ...table.children.slice(target.rowIndex + 1),
    ],
  };

  return {
    ...document,
    children: [
      ...document.children.slice(0, target.blockIndex),
      nextTable,
      ...document.children.slice(target.blockIndex + 1),
    ],
  };
}

export function applyMergeBlock(
  document: DocumentNode,
  operation: MergeBlockOperation,
): DocumentNode {
  if (!isValidPoint(document, operation.point)) {
    throw new RangeError("merge block point must reference a text node");
  }

  const tableTarget = getTableParagraphMergeTarget(document, operation);

  if (tableTarget) {
    return applyTableParagraphMerge(document, tableTarget);
  }

  const blockIndex = getMergeBlockIndex(document, operation);
  const previousBlockIndex = blockIndex - 1;
  const previousBlock = document.children[previousBlockIndex]!;
  const currentBlock = document.children[blockIndex]!;

  if (!isTextBlockNode(previousBlock) || !isTextBlockNode(currentBlock)) {
    throw new RangeError("merge block cannot cross a void block");
  }

  const mergedBlock = {
    ...previousBlock,
    children: mergeBlockChildren(previousBlock.children, currentBlock.children),
  };

  return {
    ...document,
    children: [
      ...document.children.slice(0, previousBlockIndex),
      mergedBlock,
      ...document.children.slice(blockIndex + 1),
    ],
  };
}

export function createSelectionAfterMergeBlock(
  document: DocumentNode,
  operation: MergeBlockOperation,
): RangeSelection {
  if (!isValidPoint(document, operation.point)) {
    throw new RangeError("merge block point must reference a text node");
  }

  const tableTarget = getTableParagraphMergeTarget(document, operation);

  if (tableTarget) {
    const previousChildren = tableTarget.previousParagraph.children;
    const previousEmpty = isEmptyBlockChildren(previousChildren);
    const lastTextIndex = previousEmpty ? 0 : previousChildren.length - 1;
    const lastText = previousEmpty ? createText() : previousChildren[lastTextIndex]!;
    const point = {
      path: [
        tableTarget.blockIndex,
        tableTarget.rowIndex,
        tableTarget.cellIndex,
        tableTarget.paragraphIndex - 1,
        lastTextIndex,
      ],
      offset: lastText.text.length,
    };

    return {
      anchor: point,
      focus: { path: [...point.path], offset: point.offset },
    };
  }

  const blockIndex = getMergeBlockIndex(document, operation);
  const previousBlockIndex = blockIndex - 1;
  const previousBlock = document.children[previousBlockIndex];

  if (!isTextBlockNode(previousBlock)) {
    throw new RangeError("merge block cannot cross a void block");
  }

  const previousChildren = previousBlock.children;
  const previousEmpty = isEmptyBlockChildren(previousChildren);
  const lastTextIndex = previousEmpty ? 0 : previousChildren.length - 1;
  const lastText = previousEmpty ? createText() : previousChildren[lastTextIndex]!;
  const point = {
    path: [previousBlockIndex, lastTextIndex],
    offset: lastText.text.length,
  };

  return {
    anchor: point,
    focus: {
      path: [...point.path],
      offset: point.offset,
    },
  };
}

import type { DocumentNode } from "../model";
import {
  createDeleteTextOperation,
  createMergeBlockOperation,
  createSelectionAfterDeleteText,
  createSelectionAfterMergeBlock,
  createTransaction,
  type Transaction,
} from "../operation";
import { isCollapsed, type Point, type RangeSelection } from "../selection";

export interface BackspaceInput {
  document: DocumentNode;
  selection: RangeSelection;
}

function clonePoint(point: Point): Point {
  return {
    path: [...point.path],
    offset: point.offset,
  };
}

function createCollapsedSelection(point: Point): RangeSelection {
  return {
    anchor: clonePoint(point),
    focus: clonePoint(point),
  };
}

function getCollapsedPoint(selection: RangeSelection): Point | undefined {
  return isCollapsed(selection) ? selection.anchor : undefined;
}

function isParagraphStart(point: Point): boolean {
  const [blockIndex, textIndex] = point.path;

  return blockIndex !== undefined && blockIndex > 0 && textIndex === 0;
}

function createDeletePreviousCharacterTransaction(point: Point): Transaction {
  return createTransaction([
    createDeleteTextOperation({
      anchor: {
        path: [...point.path],
        offset: point.offset - 1,
      },
      focus: clonePoint(point),
    }),
  ]);
}

function createMergePreviousParagraphTransaction(point: Point): Transaction {
  return createTransaction([createMergeBlockOperation(point)]);
}

export function createBackspaceInputTransaction(input: BackspaceInput): Transaction {
  const point = getCollapsedPoint(input.selection);

  if (!point) {
    return createTransaction();
  }

  if (point.offset > 0) {
    return createDeletePreviousCharacterTransaction(point);
  }

  if (isParagraphStart(point)) {
    return createMergePreviousParagraphTransaction(point);
  }

  return createTransaction();
}

export function createSelectionAfterBackspaceInput(
  input: BackspaceInput,
): RangeSelection {
  const transaction = createBackspaceInputTransaction(input);
  const operation = transaction.operations[0];

  if (!operation) {
    return createCollapsedSelection(input.selection.anchor);
  }

  switch (operation.type) {
    case "delete_text":
      return createSelectionAfterDeleteText(operation);
    case "merge_block":
      return createSelectionAfterMergeBlock(input.document, operation);
    case "insert_text":
    case "split_block":
    case "toggle_mark":
      return createCollapsedSelection(input.selection.anchor);
  }
}

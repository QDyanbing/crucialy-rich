import { isVoidBlockNode, type DocumentNode } from "../model";
import {
  createDeleteTextOperation,
  createMergeBlockOperation,
  createRemoveBlockOperation,
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

function isBlockStart(point: Point): boolean {
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

function createMergePreviousBlockTransaction(point: Point): Transaction {
  return createTransaction([createMergeBlockOperation(point)]);
}

function getPreviousBlockIndex(point: Point): number | undefined {
  const [blockIndex] = point.path;

  return blockIndex === undefined || blockIndex === 0 ? undefined : blockIndex - 1;
}

export function createBackspaceInputTransaction(input: BackspaceInput): Transaction {
  const point = getCollapsedPoint(input.selection);

  if (!point) {
    return createTransaction();
  }

  if (point.offset > 0) {
    return createDeletePreviousCharacterTransaction(point);
  }

  if (isBlockStart(point)) {
    const previousBlockIndex = getPreviousBlockIndex(point);
    const previousBlock =
      previousBlockIndex === undefined
        ? undefined
        : input.document.children[previousBlockIndex];

    if (previousBlockIndex !== undefined && isVoidBlockNode(previousBlock)) {
      return createTransaction([createRemoveBlockOperation([previousBlockIndex])]);
    }

    return createMergePreviousBlockTransaction(point);
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
    case "remove_block": {
      const [blockIndex, ...rest] = input.selection.anchor.path;
      const point = {
        offset: input.selection.anchor.offset,
        path: [Math.max(0, (blockIndex ?? 0) - 1), ...rest],
      };

      return createCollapsedSelection(point);
    }
    case "insert_text":
    case "insert_block":
    case "set_block_type":
    case "set_link":
    case "set_mark_attribute":
    case "split_block":
    case "toggle_mark":
      return createCollapsedSelection(input.selection.anchor);
  }
}

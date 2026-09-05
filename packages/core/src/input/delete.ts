import { isTextNode, isVoidBlockNode, type DocumentNode } from "../model";
import {
  createDeleteTextOperation,
  createMergeBlockOperation,
  createRemoveBlockOperation,
  createSelectionAfterDeleteText,
  createTransaction,
  type Transaction,
} from "../operation";
import {
  getNodeAtPath,
  isCollapsed,
  type Point,
  type RangeSelection,
} from "../selection";

export interface DeleteInput {
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

function getTextLength(document: DocumentNode, point: Point): number | undefined {
  const node = getNodeAtPath(document, point.path);

  return isTextNode(node) ? node.text.length : undefined;
}

function hasNextBlock(document: DocumentNode, point: Point): boolean {
  const [blockIndex] = point.path;

  return blockIndex !== undefined && blockIndex < document.children.length - 1;
}

function createDeleteNextCharacterTransaction(point: Point): Transaction {
  return createTransaction([
    createDeleteTextOperation({
      anchor: clonePoint(point),
      focus: {
        path: [...point.path],
        offset: point.offset + 1,
      },
    }),
  ]);
}

function createMergeNextBlockTransaction(point: Point): Transaction {
  const [blockIndex] = point.path;

  return createTransaction([
    createMergeBlockOperation({
      path: [blockIndex === undefined ? 0 : blockIndex + 1, 0],
      offset: 0,
    }),
  ]);
}

export function createDeleteInputTransaction(input: DeleteInput): Transaction {
  const point = getCollapsedPoint(input.selection);

  if (!point) {
    return createTransaction();
  }

  const textLength = getTextLength(input.document, point);

  if (textLength === undefined) {
    return createTransaction();
  }

  if (point.offset < textLength) {
    return createDeleteNextCharacterTransaction(point);
  }

  if (hasNextBlock(input.document, point)) {
    const [blockIndex] = point.path;
    const nextBlockIndex = (blockIndex ?? 0) + 1;

    if (isVoidBlockNode(input.document.children[nextBlockIndex])) {
      return createTransaction([createRemoveBlockOperation([nextBlockIndex])]);
    }

    return createMergeNextBlockTransaction(point);
  }

  return createTransaction();
}

export function createSelectionAfterDeleteInput(input: DeleteInput): RangeSelection {
  const transaction = createDeleteInputTransaction(input);
  const operation = transaction.operations[0];

  if (!operation) {
    return createCollapsedSelection(input.selection.anchor);
  }

  switch (operation.type) {
    case "delete_text":
      return createSelectionAfterDeleteText(operation);
    case "merge_block":
    case "remove_block":
      return createCollapsedSelection(input.selection.anchor);
    case "insert_text":
    case "exit_list_item":
    case "insert_block":
    case "set_block_type":
    case "set_link":
    case "set_mark_attribute":
    case "split_block":
    case "split_list_item":
    case "toggle_mark":
      return createCollapsedSelection(input.selection.anchor);
  }
}

import { isListEntryNode, isVoidBlockNode, type DocumentNode } from "../model";
import {
  createDeleteTextOperation,
  createMergeBlockOperation,
  createOutdentListItemOperation,
  createRemoveBlockOperation,
  createSelectionAfterDeleteText,
  createSelectionAfterMergeBlock,
  createSelectionAfterOutdentListItem,
  createSelectionAfterUnwrapListItem,
  createTransaction,
  createUnwrapListItemOperation,
  type Transaction,
} from "../operation";
import {
  getNodeAtPath,
  isCollapsed,
  type Point,
  type RangeSelection,
} from "../selection";

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

function createListStartTransaction(
  document: DocumentNode,
  point: Point,
): Transaction | undefined {
  const textIndex = point.path.at(-1);
  const item = getNodeAtPath(document, point.path.slice(0, -1));

  if (point.offset !== 0 || textIndex !== 0 || !isListEntryNode(item)) {
    return undefined;
  }

  return createTransaction([
    point.path.length > 3
      ? createOutdentListItemOperation(point)
      : createUnwrapListItemOperation(point),
  ]);
}

function getCollapsedPoint(selection: RangeSelection): Point | undefined {
  return isCollapsed(selection) ? selection.anchor : undefined;
}

function isMergeStart(point: Point): boolean {
  if (point.path.length === 5) {
    const paragraphIndex = point.path[3];
    const textIndex = point.path[4];

    return paragraphIndex !== undefined && paragraphIndex > 0 && textIndex === 0;
  }

  const [blockIndex, textIndex] = point.path;

  return (
    point.path.length === 2 &&
    blockIndex !== undefined &&
    blockIndex > 0 &&
    textIndex === 0
  );
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

  const listStartTransaction = createListStartTransaction(input.document, point);

  if (listStartTransaction) {
    return listStartTransaction;
  }

  if (point.offset > 0) {
    return createDeletePreviousCharacterTransaction(point);
  }

  if (isMergeStart(point)) {
    if (point.path.length === 5) {
      return createMergePreviousBlockTransaction(point);
    }

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
    case "delete_range":
      return createCollapsedSelection(input.selection.anchor);
    case "delete_text":
      return createSelectionAfterDeleteText(input.document, operation);
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
    case "outdent_list_item":
      return createSelectionAfterOutdentListItem(input.document, operation);
    case "unwrap_list_item":
      return createSelectionAfterUnwrapListItem(input.document, operation);
    case "insert_text":
    case "exit_list_item":
    case "insert_block":
    case "indent_list_item":
    case "set_block_type":
    case "set_link":
    case "set_mark_attribute":
    case "set_task_item_checked":
    case "set_table_cell_text":
    case "split_block":
    case "split_list_item":
    case "toggle_mark":
      return createCollapsedSelection(input.selection.anchor);
  }
}

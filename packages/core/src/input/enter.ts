import { isListItemNode, isTextNode, type DocumentNode } from "../model";
import {
  createExitListItemOperation,
  createInsertTextOperation,
  createSelectionAfterInsertText,
  createSelectionAfterExitListItem,
  createSelectionAfterSplitListItem,
  createSelectionAfterSplitBlock,
  createSetBlockTypeOperation,
  createSplitBlockOperation,
  createSplitListItemOperation,
  createTransaction,
  type Transaction,
} from "../operation";
import {
  getNodeAtPath,
  isCollapsed,
  type Point,
  type RangeSelection,
} from "../selection";

export interface EnterInput {
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

function getCodeBlockText(document: DocumentNode, point: Point) {
  const [blockIndex, textIndex] = point.path;

  if (blockIndex === undefined || textIndex === undefined) {
    return undefined;
  }

  const block = document.children[blockIndex];
  const text = block?.children[textIndex];

  return block?.type === "codeBlock" && isTextNode(text)
    ? { block, blockIndex, text, textIndex }
    : undefined;
}

function shouldExitCodeBlock(document: DocumentNode, point: Point): boolean {
  const target = getCodeBlockText(document, point);

  return (
    target !== undefined &&
    target.textIndex === target.block.children.length - 1 &&
    point.offset === target.text.text.length &&
    target.text.text.endsWith("\n")
  );
}

function getListItem(document: DocumentNode, point: Point) {
  if (point.path.length !== 3) {
    return undefined;
  }

  const item = getNodeAtPath(document, point.path.slice(0, -1));

  return isListItemNode(item) ? item : undefined;
}

export function createEnterInputTransaction(input: EnterInput): Transaction {
  const point = getCollapsedPoint(input.selection);

  if (!point) {
    return createTransaction();
  }

  const codeBlock = getCodeBlockText(input.document, point);
  const listItem = getListItem(input.document, point);

  if (listItem) {
    return createTransaction([
      listItem.children.every((text) => text.text.length === 0)
        ? createExitListItemOperation(point)
        : createSplitListItemOperation(point),
    ]);
  }

  if (!codeBlock) {
    return createTransaction([createSplitBlockOperation(point)]);
  }

  if (shouldExitCodeBlock(input.document, point)) {
    return createTransaction([
      createSplitBlockOperation(point),
      createSetBlockTypeOperation([codeBlock.blockIndex + 1], {
        type: "paragraph",
      }),
    ]);
  }

  return createTransaction([createInsertTextOperation(point, "\n")]);
}

export function createSelectionAfterEnterInput(input: EnterInput): RangeSelection {
  const transaction = createEnterInputTransaction(input);
  const operation = transaction.operations[0];

  if (operation?.type === "insert_text") {
    return createSelectionAfterInsertText(operation);
  }

  if (operation?.type === "split_list_item") {
    return createSelectionAfterSplitListItem(operation);
  }

  if (operation?.type === "exit_list_item") {
    return createSelectionAfterExitListItem(input.document, operation);
  }

  return operation?.type === "split_block"
    ? createSelectionAfterSplitBlock(operation)
    : createCollapsedSelection(input.selection.anchor);
}

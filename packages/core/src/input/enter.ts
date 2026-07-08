import type { DocumentNode } from "../model";
import {
  createSelectionAfterSplitBlock,
  createSplitBlockOperation,
  createTransaction,
  type Transaction,
} from "../operation";
import { isCollapsed, type Point, type RangeSelection } from "../selection";

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

export function createEnterInputTransaction(input: EnterInput): Transaction {
  const point = getCollapsedPoint(input.selection);

  return point
    ? createTransaction([createSplitBlockOperation(point)])
    : createTransaction();
}

export function createSelectionAfterEnterInput(input: EnterInput): RangeSelection {
  const transaction = createEnterInputTransaction(input);
  const operation = transaction.operations[0];

  return operation?.type === "split_block"
    ? createSelectionAfterSplitBlock(operation)
    : createCollapsedSelection(input.selection.anchor);
}

import type { DocumentNode } from "../model";
import {
  canIndentListItem,
  canOutdentListItem,
  createIndentListItemOperation,
  createOutdentListItemOperation,
  createSelectionAfterIndentListItem,
  createSelectionAfterOutdentListItem,
  createTransaction,
  type Transaction,
} from "../operation";
import { cloneRangeSelection, isCollapsed, type RangeSelection } from "../selection";

export interface TabInput {
  document: DocumentNode;
  selection: RangeSelection;
  shiftKey?: boolean;
}

export function createTabInputTransaction(input: TabInput): Transaction {
  if (!isCollapsed(input.selection)) {
    return createTransaction();
  }

  const point = input.selection.anchor;

  if (input.shiftKey) {
    return canOutdentListItem(input.document, point)
      ? createTransaction([createOutdentListItemOperation(point)])
      : createTransaction();
  }

  return canIndentListItem(input.document, point)
    ? createTransaction([createIndentListItemOperation(point)])
    : createTransaction();
}

export function createSelectionAfterTabInput(input: TabInput): RangeSelection {
  const operation = createTabInputTransaction(input).operations[0];

  if (operation?.type === "indent_list_item") {
    return createSelectionAfterIndentListItem(input.document, operation);
  }

  if (operation?.type === "outdent_list_item") {
    return createSelectionAfterOutdentListItem(input.document, operation);
  }

  return cloneRangeSelection(input.selection);
}

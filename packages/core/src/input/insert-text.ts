import { createSelectionAfterInsertText } from "../operation";
import {
  createInsertTextOperation,
  createTransaction,
  type Transaction,
} from "../operation";
import { normalizeRange, type RangeSelection } from "../selection";

export interface InsertTextInput {
  data: string;
  selection: RangeSelection;
}

function createInsertTextOperationFromInput(input: InsertTextInput) {
  const range = normalizeRange(input.selection);

  return createInsertTextOperation(range.anchor, input.data);
}

export function createInsertTextInputTransaction(input: InsertTextInput): Transaction {
  return createTransaction([createInsertTextOperationFromInput(input)]);
}

export function createSelectionAfterInsertTextInput(
  input: InsertTextInput,
): RangeSelection {
  return createSelectionAfterInsertText(createInsertTextOperationFromInput(input));
}

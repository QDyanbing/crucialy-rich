import type { Path } from "../selection";
import { isCollapsed, normalizeRange } from "../selection";
import type {
  DeleteTextOperation,
  InsertTextOperation,
  MergeBlockOperation,
  Operation,
  OperationType,
  SplitBlockOperation,
  Transaction,
} from "./types";

export type TextOperation = DeleteTextOperation | InsertTextOperation;

export type BlockOperation = MergeBlockOperation | SplitBlockOperation;

export interface OperationSummary {
  collapsedRange?: boolean;
  scope: "block" | "text";
  targetPath: Path;
  textLength?: number;
  type: OperationType;
}

export interface TransactionSummary {
  blockOperationCount: number;
  hasBlockOperations: boolean;
  hasTextOperations: boolean;
  operationCount: number;
  operationTypes: OperationType[];
  textOperationCount: number;
}

export const TEXT_OPERATION_TYPES = [
  "insert_text",
  "delete_text",
] as const satisfies readonly OperationType[];

export const BLOCK_OPERATION_TYPES = [
  "split_block",
  "merge_block",
] as const satisfies readonly OperationType[];

export function isTextOperation(operation: Operation): operation is TextOperation {
  return operation.type === "insert_text" || operation.type === "delete_text";
}

export function isBlockOperation(operation: Operation): operation is BlockOperation {
  return operation.type === "split_block" || operation.type === "merge_block";
}

export function summarizeOperation(operation: Operation): OperationSummary {
  switch (operation.type) {
    case "delete_text": {
      const range = normalizeRange(operation.range);

      return {
        collapsedRange: isCollapsed(range),
        scope: "text",
        targetPath: [...range.anchor.path],
        textLength: range.focus.offset - range.anchor.offset,
        type: "delete_text",
      };
    }
    case "insert_text":
      return {
        scope: "text",
        targetPath: [...operation.point.path],
        textLength: operation.text.length,
        type: "insert_text",
      };
    case "merge_block":
      return {
        scope: "block",
        targetPath: [...operation.point.path],
        type: "merge_block",
      };
    case "split_block":
      return {
        scope: "block",
        targetPath: [...operation.point.path],
        type: "split_block",
      };
  }
}

export function summarizeTransaction(transaction: Transaction): TransactionSummary {
  const operationSummaries = transaction.operations.map(summarizeOperation);
  const textOperationCount = operationSummaries.filter(
    (summary) => summary.scope === "text",
  ).length;
  const blockOperationCount = operationSummaries.filter(
    (summary) => summary.scope === "block",
  ).length;

  return {
    blockOperationCount,
    hasBlockOperations: blockOperationCount > 0,
    hasTextOperations: textOperationCount > 0,
    operationCount: operationSummaries.length,
    operationTypes: operationSummaries.map((summary) => summary.type),
    textOperationCount,
  };
}

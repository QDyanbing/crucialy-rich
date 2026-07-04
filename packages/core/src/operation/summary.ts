import type {
  DeleteTextOperation,
  InsertTextOperation,
  MergeBlockOperation,
  Operation,
  OperationType,
  SplitBlockOperation,
} from "./types";

export type TextOperation = DeleteTextOperation | InsertTextOperation;

export type BlockOperation = MergeBlockOperation | SplitBlockOperation;

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

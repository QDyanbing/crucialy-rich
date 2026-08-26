import type {
  BlockType,
  HeadingLevel,
  TextMarkAttributeType,
  TextMarkType,
} from "../model";
import type { Path } from "../selection";
import { isCollapsed, normalizeRange } from "../selection";
import type {
  DeleteTextOperation,
  InsertTextOperation,
  MergeBlockOperation,
  Operation,
  OperationType,
  SetBlockTypeOperation,
  SetLinkOperation,
  SetMarkAttributeOperation,
  SplitBlockOperation,
  ToggleMarkOperation,
  Transaction,
} from "./types";

export type TextOperation =
  | DeleteTextOperation
  | InsertTextOperation
  | SetLinkOperation
  | SetMarkAttributeOperation
  | ToggleMarkOperation;

export type BlockOperation =
  | MergeBlockOperation
  | SetBlockTypeOperation
  | SplitBlockOperation;

export interface OperationSummary {
  collapsedRange?: boolean;
  attribute?: TextMarkAttributeType;
  blockType?: BlockType;
  mark?: TextMarkType;
  scope: "block" | "text";
  targetPath: Path;
  textLength?: number;
  type: OperationType;
  value?: number | string | null;
  linkHref?: string | null;
  headingLevel?: HeadingLevel;
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
  "toggle_mark",
  "set_mark_attribute",
  "set_link",
] as const satisfies readonly OperationType[];

export const BLOCK_OPERATION_TYPES = [
  "set_block_type",
  "split_block",
  "merge_block",
] as const satisfies readonly OperationType[];

export function isTextOperation(operation: Operation): operation is TextOperation {
  return (
    operation.type === "insert_text" ||
    operation.type === "delete_text" ||
    operation.type === "set_mark_attribute" ||
    operation.type === "set_link" ||
    operation.type === "toggle_mark"
  );
}

export function isBlockOperation(operation: Operation): operation is BlockOperation {
  return (
    operation.type === "set_block_type" ||
    operation.type === "split_block" ||
    operation.type === "merge_block"
  );
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
    case "toggle_mark": {
      const range = normalizeRange(operation.range);

      return {
        collapsedRange: isCollapsed(range),
        mark: operation.mark,
        scope: "text",
        targetPath: [...range.anchor.path],
        textLength: range.focus.offset - range.anchor.offset,
        type: "toggle_mark",
      };
    }
    case "set_mark_attribute": {
      const range = normalizeRange(operation.range);

      return {
        attribute: operation.attribute,
        collapsedRange: isCollapsed(range),
        scope: "text",
        targetPath: [...range.anchor.path],
        textLength: range.focus.offset - range.anchor.offset,
        type: "set_mark_attribute",
        value: operation.value,
      };
    }
    case "set_link": {
      const range = normalizeRange(operation.range);

      return {
        collapsedRange: isCollapsed(range),
        linkHref: operation.link?.href ?? null,
        scope: "text",
        targetPath: [...range.anchor.path],
        textLength: range.focus.offset - range.anchor.offset,
        type: "set_link",
      };
    }
    case "set_block_type":
      return {
        blockType: operation.block.type,
        ...(operation.block.type === "heading"
          ? { headingLevel: operation.block.level }
          : {}),
        scope: "block",
        targetPath: [...operation.path],
        type: "set_block_type",
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

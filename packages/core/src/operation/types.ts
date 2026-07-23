import type { TextMarkType } from "../model";
import type { Point, RangeSelection } from "../selection";

export const OPERATION_TYPES = [
  "insert_text",
  "delete_text",
  "toggle_mark",
  "split_block",
  "merge_block",
] as const;

export type OperationType = (typeof OPERATION_TYPES)[number];

export interface InsertTextOperation {
  point: Point;
  text: string;
  type: "insert_text";
}

export interface DeleteTextOperation {
  range: RangeSelection;
  type: "delete_text";
}

export interface ToggleMarkOperation {
  mark: TextMarkType;
  range: RangeSelection;
  type: "toggle_mark";
}

export interface SplitBlockOperation {
  point: Point;
  type: "split_block";
}

export interface MergeBlockOperation {
  point: Point;
  type: "merge_block";
}

export type Operation =
  | DeleteTextOperation
  | InsertTextOperation
  | MergeBlockOperation
  | SplitBlockOperation
  | ToggleMarkOperation;

export interface Transaction {
  operations: Operation[];
}

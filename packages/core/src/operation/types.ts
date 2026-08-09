import type { TextMarkAttributes, TextMarkAttributeType, TextMarkType } from "../model";
import type { Point, RangeSelection } from "../selection";

export const OPERATION_TYPES = [
  "insert_text",
  "delete_text",
  "toggle_mark",
  "set_mark_attribute",
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

export interface SetMarkAttributeOperation<
  TAttribute extends TextMarkAttributeType = TextMarkAttributeType,
> {
  attribute: TAttribute;
  range: RangeSelection;
  type: "set_mark_attribute";
  value: TextMarkAttributes[TAttribute] | null;
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
  | SetMarkAttributeOperation
  | SplitBlockOperation
  | ToggleMarkOperation;

export interface Transaction {
  operations: Operation[];
}

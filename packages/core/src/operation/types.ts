import type { Point, RangeSelection } from "../selection";

export interface InsertTextOperation {
  point: Point;
  text: string;
  type: "insert_text";
}

export interface DeleteTextOperation {
  range: RangeSelection;
  type: "delete_text";
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
  | SplitBlockOperation;

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

export type Operation = DeleteTextOperation | InsertTextOperation;

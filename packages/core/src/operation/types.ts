import type { Point } from "../selection";

export interface InsertTextOperation {
  point: Point;
  text: string;
  type: "insert_text";
}

export type Operation = InsertTextOperation;

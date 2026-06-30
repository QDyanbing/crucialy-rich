import type { Point } from "../selection";
import type { InsertTextOperation } from "./types";

export function createInsertTextOperation(
  point: Point,
  text: string,
): InsertTextOperation {
  return {
    point: {
      path: [...point.path],
      offset: point.offset,
    },
    text,
    type: "insert_text",
  };
}

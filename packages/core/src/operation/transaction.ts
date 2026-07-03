import type { Point, RangeSelection } from "../selection";
import type { Operation, Transaction } from "./types";

function clonePoint(point: Point): Point {
  return {
    path: [...point.path],
    offset: point.offset,
  };
}

function cloneRange(range: RangeSelection): RangeSelection {
  return {
    anchor: clonePoint(range.anchor),
    focus: clonePoint(range.focus),
  };
}

export function cloneOperation(operation: Operation): Operation {
  switch (operation.type) {
    case "delete_text":
      return {
        range: cloneRange(operation.range),
        type: "delete_text",
      };
    case "insert_text":
      return {
        point: clonePoint(operation.point),
        text: operation.text,
        type: "insert_text",
      };
    case "merge_block":
      return {
        point: clonePoint(operation.point),
        type: "merge_block",
      };
    case "split_block":
      return {
        point: clonePoint(operation.point),
        type: "split_block",
      };
  }
}

export function createTransaction(operations: Operation[] = []): Transaction {
  return {
    operations: operations.map(cloneOperation),
  };
}

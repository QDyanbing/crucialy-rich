import type { Point } from "../selection";
import type { MergeBlockOperation } from "./types";

export function createMergeBlockOperation(point: Point): MergeBlockOperation {
  return {
    point: {
      path: [...point.path],
      offset: point.offset,
    },
    type: "merge_block",
  };
}

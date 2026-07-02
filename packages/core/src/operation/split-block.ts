import type { Point } from "../selection";
import type { SplitBlockOperation } from "./types";

export function createSplitBlockOperation(point: Point): SplitBlockOperation {
  return {
    point: {
      path: [...point.path],
      offset: point.offset,
    },
    type: "split_block",
  };
}

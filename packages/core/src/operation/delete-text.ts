import type { RangeSelection } from "../selection";
import type { DeleteTextOperation } from "./types";

export function createDeleteTextOperation(range: RangeSelection): DeleteTextOperation {
  return {
    range: {
      anchor: {
        path: [...range.anchor.path],
        offset: range.anchor.offset,
      },
      focus: {
        path: [...range.focus.path],
        offset: range.focus.offset,
      },
    },
    type: "delete_text",
  };
}

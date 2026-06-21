import { comparePoint } from "./point";
import type { RangeSelection } from "./types";

export function isCollapsed(selection: RangeSelection): boolean {
  return comparePoint(selection.anchor, selection.focus) === 0;
}

import { comparePoint } from "./point";
import type { RangeSelection } from "./types";

export function isCollapsed(selection: RangeSelection): boolean {
  return comparePoint(selection.anchor, selection.focus) === 0;
}

/**
 * 返回正向选区，anchor 总是小于或等于 focus。
 */
export function normalizeRange(selection: RangeSelection): RangeSelection {
  if (comparePoint(selection.anchor, selection.focus) <= 0) {
    return selection;
  }

  return {
    anchor: selection.focus,
    focus: selection.anchor,
  };
}

export function compareRange(left: RangeSelection, right: RangeSelection): -1 | 0 | 1 {
  const normalizedLeft = normalizeRange(left);
  const normalizedRight = normalizeRange(right);
  const anchorResult = comparePoint(normalizedLeft.anchor, normalizedRight.anchor);

  if (anchorResult !== 0) {
    return anchorResult;
  }

  return comparePoint(normalizedLeft.focus, normalizedRight.focus);
}

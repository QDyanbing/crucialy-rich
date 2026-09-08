import { isCollapsed, type RangeSelection } from "@crucialy-rich/core";

export function isFloatingToolbarVisible(selection?: RangeSelection): boolean {
  return selection !== undefined && !isCollapsed(selection);
}

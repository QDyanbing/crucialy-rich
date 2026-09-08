import { cloneRangeSelection, type RangeSelection } from "@crucialy-rich/core";

export function createToolbarSelectionSnapshot(
  selection?: RangeSelection,
): RangeSelection | undefined {
  return selection ? cloneRangeSelection(selection) : undefined;
}

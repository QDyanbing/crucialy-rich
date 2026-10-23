import type { DocumentNode } from "../model";
import {
  getTextInRange,
  isCollapsed,
  isValidPoint,
  type RangeSelection,
} from "../selection";

export function getClipboardText(
  document: DocumentNode,
  selection: RangeSelection,
): string | undefined {
  if (
    isCollapsed(selection) ||
    !isValidPoint(document, selection.anchor) ||
    !isValidPoint(document, selection.focus)
  ) {
    return undefined;
  }

  const text = getTextInRange(document, selection);
  return text.length > 0 ? text : undefined;
}

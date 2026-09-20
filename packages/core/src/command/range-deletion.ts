import type { DocumentNode } from "../model";
import {
  canDeleteRange,
  createDeleteRangeOperation,
  createDeleteTextOperation,
  createSelectionAfterDeleteRange,
  createSelectionAfterDeleteText,
  type DeleteRangeOperation,
  type DeleteTextOperation,
} from "../operation";
import {
  isCollapsed,
  isSameTextContainer,
  isValidPoint,
  normalizeRange,
  type RangeSelection,
} from "../selection";

export type RangeDeletionOperation = DeleteRangeOperation | DeleteTextOperation;

export interface RangeDeletionPlan {
  operation: RangeDeletionOperation;
  selection: RangeSelection;
}

export function createRangeDeletionPlan(
  document: DocumentNode,
  selection: RangeSelection,
): RangeDeletionPlan | undefined {
  const range = normalizeRange(selection);

  if (
    isCollapsed(range) ||
    !isValidPoint(document, range.anchor) ||
    !isValidPoint(document, range.focus)
  ) {
    return undefined;
  }

  if (isSameTextContainer(range.anchor, range.focus)) {
    const operation = createDeleteTextOperation(range);

    return {
      operation,
      selection: createSelectionAfterDeleteText(document, operation),
    };
  }

  if (!canDeleteRange(document, range)) {
    return undefined;
  }

  const operation = createDeleteRangeOperation(range);

  return {
    operation,
    selection: createSelectionAfterDeleteRange(document, operation),
  };
}

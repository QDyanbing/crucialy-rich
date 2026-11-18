import {
  cloneRangeSelection,
  isValidPoint,
  type DocumentNode,
  type RangeSelection,
} from "@crucialy-rich/core";

export interface LinkSelectionSnapshot {
  readonly document: DocumentNode;
  readonly selection: RangeSelection;
}

export function createLinkSelectionSnapshot(
  document: DocumentNode,
  selection: RangeSelection,
): LinkSelectionSnapshot | undefined {
  if (
    !isValidPoint(document, selection.anchor) ||
    !isValidPoint(document, selection.focus)
  )
    return undefined;
  return { document, selection: cloneRangeSelection(selection) };
}

export function readLinkSelectionSnapshot(
  snapshot: LinkSelectionSnapshot | null,
  document: DocumentNode,
): RangeSelection | undefined {
  return snapshot?.document === document
    ? createLinkSelectionSnapshot(document, snapshot.selection)?.selection
    : undefined;
}

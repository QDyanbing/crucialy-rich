import { createTransaction } from "../operation";
import { comparePoint, isCollapsed, isValidPoint } from "../selection";
import { cloneHistorySnapshot } from "./snapshot";
import type { HistoryEntry, HistoryMergePolicy } from "./types";

export function canMergeHistoryEntries(
  previous: HistoryEntry | undefined,
  next: HistoryEntry,
  mergePolicy: HistoryMergePolicy = "batch",
): previous is HistoryEntry {
  if (!previous?.batch || previous.batch !== next.batch) {
    return false;
  }

  if (mergePolicy === "batch") {
    return true;
  }

  const previousSelection = previous.after.selection;
  const nextSelection = next.before.selection;

  return Boolean(
    mergePolicy === "adjacent" &&
      previousSelection &&
      nextSelection &&
      isCollapsed(previousSelection) &&
      isCollapsed(nextSelection) &&
      isValidPoint(previous.after.document, previousSelection.anchor) &&
      isValidPoint(next.before.document, nextSelection.anchor) &&
      comparePoint(previousSelection.anchor, nextSelection.anchor) === 0,
  );
}

export function mergeHistoryEntries(
  previous: HistoryEntry,
  next: HistoryEntry,
): HistoryEntry {
  const entry: HistoryEntry = {
    after: cloneHistorySnapshot(next.after),
    before: cloneHistorySnapshot(previous.before),
    transaction: createTransaction([
      ...previous.transaction.operations,
      ...next.transaction.operations,
    ]),
  };

  return next.batch ? { ...entry, batch: next.batch } : entry;
}

import { createTransaction } from "../operation";
import { cloneHistorySnapshot } from "./snapshot";
import type { HistoryEntry } from "./types";

export function canMergeHistoryEntries(
  previous: HistoryEntry | undefined,
  next: HistoryEntry,
): previous is HistoryEntry {
  return Boolean(previous?.batch && previous.batch === next.batch);
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

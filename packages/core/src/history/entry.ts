import { createTransaction } from "../operation";
import { cloneHistorySnapshot } from "./snapshot";
import type { HistoryEntry, RecordHistoryInput } from "./types";

export function createHistoryEntry(input: RecordHistoryInput): HistoryEntry {
  const entry: HistoryEntry = {
    after: cloneHistorySnapshot(input.after),
    before: cloneHistorySnapshot(input.before),
    transaction: createTransaction(input.transaction.operations),
  };

  return input.batch ? { ...entry, batch: input.batch } : entry;
}

export function cloneHistoryEntry(entry: HistoryEntry): HistoryEntry {
  const clonedEntry: HistoryEntry = {
    after: cloneHistorySnapshot(entry.after),
    before: cloneHistorySnapshot(entry.before),
    transaction: createTransaction(entry.transaction.operations),
  };

  return entry.batch ? { ...clonedEntry, batch: entry.batch } : clonedEntry;
}

import { createTransaction } from "../operation";
import { cloneHistorySnapshot } from "./snapshot";
import type { HistoryEntry, HistoryState, RecordHistoryInput } from "./types";

function createHistoryEntry(input: RecordHistoryInput): HistoryEntry {
  const entry: HistoryEntry = {
    after: cloneHistorySnapshot(input.after),
    before: cloneHistorySnapshot(input.before),
    transaction: createTransaction(input.transaction.operations),
  };

  return input.batch ? { ...entry, batch: input.batch } : entry;
}

export function recordHistory(input: RecordHistoryInput): HistoryState {
  if (input.transaction.operations.length === 0) {
    return {
      redoStack: [...input.history.redoStack],
      undoStack: [...input.history.undoStack],
    };
  }

  return {
    redoStack: [],
    undoStack: [...input.history.undoStack, createHistoryEntry(input)],
  };
}

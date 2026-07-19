import { createHistoryEntry } from "./entry";
import { canMergeHistoryEntries, mergeHistoryEntries } from "./merge";
import type { HistoryState, RecordHistoryInput } from "./types";

export function recordHistory(input: RecordHistoryInput): HistoryState {
  if (input.transaction.operations.length === 0) {
    return {
      redoStack: [...input.history.redoStack],
      undoStack: [...input.history.undoStack],
    };
  }

  const nextEntry = createHistoryEntry(input);
  const previousEntry = input.history.undoStack.at(-1);

  if (canMergeHistoryEntries(previousEntry, nextEntry)) {
    return {
      redoStack: [],
      undoStack: [
        ...input.history.undoStack.slice(0, -1),
        mergeHistoryEntries(previousEntry, nextEntry),
      ],
    };
  }

  return {
    redoStack: [],
    undoStack: [...input.history.undoStack, nextEntry],
  };
}

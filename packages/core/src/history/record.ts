import { createHistoryEntry } from "./entry";
import type { HistoryState, RecordHistoryInput } from "./types";

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

import { cloneHistoryEntry } from "./entry";
import type { HistoryEntry, HistoryState } from "./types";

export function createHistoryState(
  undoStack: HistoryEntry[] = [],
  redoStack: HistoryEntry[] = [],
): HistoryState {
  return {
    redoStack: redoStack.map(cloneHistoryEntry),
    undoStack: undoStack.map(cloneHistoryEntry),
  };
}

export function clearHistory(): HistoryState {
  return createHistoryState();
}

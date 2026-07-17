import type { HistoryEntry, HistoryState } from "./types";

export function createHistoryState(
  undoStack: HistoryEntry[] = [],
  redoStack: HistoryEntry[] = [],
): HistoryState {
  return {
    redoStack: [...redoStack],
    undoStack: [...undoStack],
  };
}

export function clearHistory(): HistoryState {
  return createHistoryState();
}

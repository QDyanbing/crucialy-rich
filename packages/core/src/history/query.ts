import type { HistoryEntry, HistoryState } from "./types";

export function canUndo(history: HistoryState): boolean {
  return history.undoStack.length > 0;
}

export function canRedo(history: HistoryState): boolean {
  return history.redoStack.length > 0;
}

export function getUndoEntry(history: HistoryState): HistoryEntry | undefined {
  return history.undoStack.at(-1);
}

export function getRedoEntry(history: HistoryState): HistoryEntry | undefined {
  return history.redoStack.at(-1);
}

import { cloneHistoryEntry } from "./entry";
import { cloneHistorySnapshot } from "./snapshot";
import type { HistoryChange, HistoryEntry, HistoryState } from "./types";

function cloneHistoryStack(stack: HistoryEntry[]): HistoryEntry[] {
  return stack.map((entry) => cloneHistoryEntry(entry));
}

export function redoHistory(history: HistoryState): HistoryChange | undefined {
  const entry = history.redoStack.at(-1);

  if (!entry) {
    return undefined;
  }

  const after = cloneHistorySnapshot(entry.after);
  const change: Omit<HistoryChange, "selection"> = {
    document: after.document,
    entry: cloneHistoryEntry(entry),
    history: {
      redoStack: cloneHistoryStack(history.redoStack.slice(0, -1)),
      undoStack: [...cloneHistoryStack(history.undoStack), cloneHistoryEntry(entry)],
    },
  };

  return after.selection ? { ...change, selection: after.selection } : change;
}

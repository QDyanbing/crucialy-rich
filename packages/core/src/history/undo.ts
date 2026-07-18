import { cloneHistoryEntry } from "./entry";
import { cloneHistorySnapshot } from "./snapshot";
import type { HistoryChange, HistoryEntry, HistoryState } from "./types";

function cloneHistoryStack(stack: HistoryEntry[]): HistoryEntry[] {
  return stack.map((entry) => cloneHistoryEntry(entry));
}

export function undoHistory(history: HistoryState): HistoryChange | undefined {
  const entry = history.undoStack.at(-1);

  if (!entry) {
    return undefined;
  }

  const before = cloneHistorySnapshot(entry.before);
  const change: Omit<HistoryChange, "selection"> = {
    document: before.document,
    entry: cloneHistoryEntry(entry),
    history: {
      redoStack: [...cloneHistoryStack(history.redoStack), cloneHistoryEntry(entry)],
      undoStack: cloneHistoryStack(history.undoStack.slice(0, -1)),
    },
  };

  return before.selection ? { ...change, selection: before.selection } : change;
}

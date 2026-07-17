import type { DocumentNode } from "../model";
import type { Transaction } from "../operation";
import type { RangeSelection } from "../selection";

export interface HistorySnapshot {
  document: DocumentNode;
  selection?: RangeSelection;
}

export interface HistoryEntry {
  after: HistorySnapshot;
  batch?: string;
  before: HistorySnapshot;
  transaction: Transaction;
}

export interface HistoryState {
  redoStack: HistoryEntry[];
  undoStack: HistoryEntry[];
}

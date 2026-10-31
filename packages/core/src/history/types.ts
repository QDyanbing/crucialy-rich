import type { DocumentNode } from "../model";
import type { Transaction } from "../operation";
import type { BlockSelection, RangeSelection } from "../selection";

export type HistoryMergePolicy = "batch" | "adjacent";

export interface HistorySnapshot {
  blockSelection?: BlockSelection;
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

export interface HistoryChange {
  blockSelection?: BlockSelection;
  document: DocumentNode;
  entry: HistoryEntry;
  history: HistoryState;
  selection?: RangeSelection;
}

export interface RecordHistoryInput {
  after: HistorySnapshot;
  batch?: string;
  before: HistorySnapshot;
  history: HistoryState;
  mergePolicy?: HistoryMergePolicy;
  transaction: Transaction;
}

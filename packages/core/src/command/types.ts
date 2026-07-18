import type { DocumentNode } from "../model";
import type { Transaction } from "../operation";
import type { RangeSelection } from "../selection";
import type { HistoryState } from "../history/types";

export type CommandName = string;

export interface CommandContext {
  document: DocumentNode;
  selection?: RangeSelection;
}

export interface CommandInput<TPayload = unknown> {
  context: CommandContext;
  payload?: TPayload;
}

export type CommandResultStatus = "success" | "failure" | "skipped";

export interface CommandResult {
  commandName: CommandName;
  document?: DocumentNode;
  history?: HistoryState;
  ok: boolean;
  status: CommandResultStatus;
  reason?: string;
  selection?: RangeSelection;
  transaction?: Transaction;
}

export interface Command {
  name: CommandName;
  canExecute?: (input: CommandInput) => boolean;
  execute: (input: CommandInput) => CommandResult;
  isActive?: (input: CommandInput) => boolean;
}

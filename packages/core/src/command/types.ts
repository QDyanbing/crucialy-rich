import type { DocumentNode } from "../model";
import type { Transaction } from "../operation";
import type { RangeSelection } from "../selection";

export type CommandName = string;

export interface CommandContext {
  document: DocumentNode;
  selection?: RangeSelection;
}

export interface CommandInput<TPayload = undefined> {
  context: CommandContext;
  payload?: TPayload;
}

export type CommandResultStatus = "success" | "failure" | "skipped";

export interface CommandResult {
  commandName: CommandName;
  ok: boolean;
  status: CommandResultStatus;
  reason?: string;
  selection?: RangeSelection;
  transaction?: Transaction;
}

export interface Command<TPayload = undefined> {
  name: CommandName;
  canExecute?: (input: CommandInput<TPayload>) => boolean;
  execute: (input: CommandInput<TPayload>) => CommandResult;
}

import { createCommandSkipped, createCommandSuccess } from "../command/result";
import type { Command, CommandInput, CommandResult } from "../command/types";
import { canRedo, canUndo } from "./query";
import { redoHistory } from "./redo";
import { undoHistory } from "./undo";
import type { HistoryChange, HistoryState } from "./types";

export const UNDO_COMMAND_NAME = "undo";
export const REDO_COMMAND_NAME = "redo";

export interface HistoryCommandPayload {
  history: HistoryState;
}

function isHistoryState(value: unknown): value is HistoryState {
  return (
    typeof value === "object" &&
    value !== null &&
    "redoStack" in value &&
    "undoStack" in value &&
    Array.isArray(value.redoStack) &&
    Array.isArray(value.undoStack)
  );
}

function hasHistoryCommandPayload(payload: unknown): payload is HistoryCommandPayload {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "history" in payload &&
    isHistoryState(payload.history)
  );
}

function createHistoryCommandSuccess(
  commandName: string,
  change: HistoryChange,
): CommandResult {
  const result: Omit<CommandResult, "commandName" | "ok" | "status"> = {
    document: change.document,
    history: change.history,
  };

  if (change.selection) {
    result.selection = change.selection;
  }

  return createCommandSuccess(commandName, result);
}

export function canExecuteUndoCommand(input: CommandInput): boolean {
  return hasHistoryCommandPayload(input.payload) && canUndo(input.payload.history);
}

export function canExecuteRedoCommand(input: CommandInput): boolean {
  return hasHistoryCommandPayload(input.payload) && canRedo(input.payload.history);
}

export const undoCommand: Command = {
  canExecute: canExecuteUndoCommand,
  execute(input) {
    if (!hasHistoryCommandPayload(input.payload)) {
      return createCommandSkipped(
        UNDO_COMMAND_NAME,
        "Undo command requires history payload.",
      );
    }

    const change = undoHistory(input.payload.history);

    return change
      ? createHistoryCommandSuccess(UNDO_COMMAND_NAME, change)
      : createCommandSkipped(UNDO_COMMAND_NAME, "Nothing to undo.");
  },
  name: UNDO_COMMAND_NAME,
};

export const redoCommand: Command = {
  canExecute: canExecuteRedoCommand,
  execute(input) {
    if (!hasHistoryCommandPayload(input.payload)) {
      return createCommandSkipped(
        REDO_COMMAND_NAME,
        "Redo command requires history payload.",
      );
    }

    const change = redoHistory(input.payload.history);

    return change
      ? createHistoryCommandSuccess(REDO_COMMAND_NAME, change)
      : createCommandSkipped(REDO_COMMAND_NAME, "Nothing to redo.");
  },
  name: REDO_COMMAND_NAME,
};

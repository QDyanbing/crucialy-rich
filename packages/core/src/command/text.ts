import {
  createDeleteTextOperation,
  createInsertTextOperation,
  createSelectionAfterDeleteText,
  createSelectionAfterInsertText,
  createTransaction,
} from "../operation";
import {
  isCollapsed,
  isSameTextContainer,
  isValidPoint,
  normalizeRange,
} from "../selection";
import {
  createCommandFailure,
  createCommandSkipped,
  createCommandSuccess,
} from "./result";
import type { Command, CommandInput } from "./types";

export const INSERT_TEXT_COMMAND_NAME = "insertText";
export const DELETE_SELECTION_COMMAND_NAME = "deleteSelection";

export interface InsertTextCommandPayload {
  text: string;
}

function hasInsertTextPayload(payload: unknown): payload is InsertTextCommandPayload {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "text" in payload &&
    typeof payload.text === "string"
  );
}

function canEditTextRange(input: CommandInput): boolean {
  const selection = input.context.selection;

  if (!selection) {
    return false;
  }

  const range = normalizeRange(selection);

  return (
    isValidPoint(input.context.document, range.anchor) &&
    isValidPoint(input.context.document, range.focus) &&
    (isCollapsed(range) || isSameTextContainer(range.anchor, range.focus))
  );
}

function canDeleteTextRange(input: CommandInput): boolean {
  const selection = input.context.selection;

  if (!selection) {
    return false;
  }

  const range = normalizeRange(selection);

  return (
    !isCollapsed(range) &&
    isValidPoint(input.context.document, range.anchor) &&
    isValidPoint(input.context.document, range.focus) &&
    isSameTextContainer(range.anchor, range.focus)
  );
}

export function canExecuteInsertTextCommand(input: CommandInput): boolean {
  return hasInsertTextPayload(input.payload) && canEditTextRange(input);
}

export const insertTextCommand: Command = {
  canExecute: canExecuteInsertTextCommand,
  execute(input) {
    if (!hasInsertTextPayload(input.payload)) {
      return createCommandFailure(
        INSERT_TEXT_COMMAND_NAME,
        "Insert text command requires text payload.",
      );
    }

    const selection = input.context.selection;

    if (!selection || !canEditTextRange(input)) {
      return createCommandSkipped(
        INSERT_TEXT_COMMAND_NAME,
        "Insert text command requires an editable text selection.",
      );
    }

    const range = normalizeRange(selection);
    const deleteOperation = isCollapsed(range)
      ? undefined
      : createDeleteTextOperation(range);
    const insertPoint = deleteOperation
      ? createSelectionAfterDeleteText(input.context.document, deleteOperation).anchor
      : range.anchor;
    const insertOperation = createInsertTextOperation(insertPoint, input.payload.text);
    const operations = deleteOperation
      ? [deleteOperation, insertOperation]
      : [insertOperation];

    return createCommandSuccess(INSERT_TEXT_COMMAND_NAME, {
      selection: createSelectionAfterInsertText(insertOperation),
      transaction: createTransaction(operations),
    });
  },
  name: INSERT_TEXT_COMMAND_NAME,
};

export function canExecuteDeleteSelectionCommand(input: CommandInput): boolean {
  return canDeleteTextRange(input);
}

export const deleteSelectionCommand: Command = {
  canExecute: canExecuteDeleteSelectionCommand,
  execute(input) {
    const selection = input.context.selection;

    if (!selection || !canDeleteTextRange(input)) {
      return createCommandSkipped(
        DELETE_SELECTION_COMMAND_NAME,
        "Delete selection command requires a non-collapsed text selection.",
      );
    }

    const operation = createDeleteTextOperation(normalizeRange(selection));

    return createCommandSuccess(DELETE_SELECTION_COMMAND_NAME, {
      selection: createSelectionAfterDeleteText(input.context.document, operation),
      transaction: createTransaction([operation]),
    });
  },
  name: DELETE_SELECTION_COMMAND_NAME,
};

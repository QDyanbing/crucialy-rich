import {
  createDeleteTextOperation,
  createInsertTextOperation,
  createSelectionAfterInsertText,
  createTransaction,
} from "../operation";
import { isCollapsed, isValidPoint, normalizeRange, type Path } from "../selection";
import {
  createCommandFailure,
  createCommandSkipped,
  createCommandSuccess,
} from "./result";
import type { Command, CommandInput } from "./types";

export const INSERT_TEXT_COMMAND_NAME = "insertText";

export interface InsertTextCommandPayload {
  text: string;
}

function isSamePath(left: Path, right: Path): boolean {
  return (
    left.length === right.length && left.every((part, index) => part === right[index])
  );
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
    (isCollapsed(range) || isSamePath(range.anchor.path, range.focus.path))
  );
}

export function canExecuteInsertTextCommand(
  input: CommandInput<InsertTextCommandPayload>,
): boolean {
  return hasInsertTextPayload(input.payload) && canEditTextRange(input);
}

export const insertTextCommand: Command<InsertTextCommandPayload> = {
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
    const insertOperation = createInsertTextOperation(range.anchor, input.payload.text);
    const operations = isCollapsed(range)
      ? [insertOperation]
      : [createDeleteTextOperation(range), insertOperation];

    return createCommandSuccess(INSERT_TEXT_COMMAND_NAME, {
      selection: createSelectionAfterInsertText(insertOperation),
      transaction: createTransaction(operations),
    });
  },
  name: INSERT_TEXT_COMMAND_NAME,
};

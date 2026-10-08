import {
  applyTransaction,
  createClearMarksOperation,
  createSelectionAfterClearMarks,
  createTransaction,
} from "../operation";
import { createCommandSkipped, createCommandSuccess } from "./result";
import {
  getTextMarkCommandRanges,
  restoreTextMarkCommandSelection,
} from "./text-mark-range";
import type { Command, CommandInput } from "./types";

export const CLEAR_FORMATTING_COMMAND_NAME = "clearFormatting";

function getClearFormattingRanges(input: CommandInput) {
  const selection = input.context.selection;

  return selection
    ? getTextMarkCommandRanges(input.context.document, selection)
    : undefined;
}

export function canExecuteClearFormattingCommand(input: CommandInput): boolean {
  return getClearFormattingRanges(input) !== undefined;
}

export const clearFormattingCommand: Command = {
  canExecute: canExecuteClearFormattingCommand,
  execute(input) {
    const selection = input.context.selection;
    const ranges = getClearFormattingRanges(input);

    if (!selection || !ranges) {
      return createCommandSkipped(
        CLEAR_FORMATTING_COMMAND_NAME,
        "Clear formatting command requires a text selection.",
      );
    }

    const operations = ranges.map(({ range }) => createClearMarksOperation(range));
    const transaction = createTransaction(operations);
    const nextSelection =
      selection.anchor.path[0] === selection.focus.path[0]
        ? createSelectionAfterClearMarks(input.context.document, operations[0]!)
        : restoreTextMarkCommandSelection(
            input.context.document,
            selection,
            applyTransaction(input.context.document, transaction),
          );

    if (!nextSelection) {
      return createCommandSkipped(
        CLEAR_FORMATTING_COMMAND_NAME,
        "Clear formatting command could not restore the text selection.",
      );
    }

    return createCommandSuccess(CLEAR_FORMATTING_COMMAND_NAME, {
      selection: nextSelection,
      transaction,
    });
  },
  name: CLEAR_FORMATTING_COMMAND_NAME,
};

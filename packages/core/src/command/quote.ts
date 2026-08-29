import { createSetBlockTypeOperation, createTransaction } from "../operation";
import { cloneRangeSelection } from "../selection";
import { getSelectedBlockIndexes } from "./block-selection";
import { createCommandSkipped, createCommandSuccess } from "./result";
import type { Command, CommandInput } from "./types";

export const TOGGLE_QUOTE_COMMAND_NAME = "toggleQuote";

export function canExecuteToggleQuoteCommand(input: CommandInput): boolean {
  return getSelectedBlockIndexes(input) !== undefined;
}

export function isQuoteCommandActive(input: CommandInput): boolean {
  const blockIndexes = getSelectedBlockIndexes(input);

  return (
    blockIndexes !== undefined &&
    blockIndexes.every(
      (blockIndex) => input.context.document.children[blockIndex]?.type === "quote",
    )
  );
}

export const toggleQuoteCommand: Command = {
  canExecute: canExecuteToggleQuoteCommand,
  execute(input) {
    const blockIndexes = getSelectedBlockIndexes(input);
    const selection = input.context.selection;

    if (!blockIndexes || !selection) {
      return createCommandSkipped(
        TOGGLE_QUOTE_COMMAND_NAME,
        "Toggle quote command requires a valid text selection.",
      );
    }

    const allSelectedBlocksAreQuotes = blockIndexes.every(
      (blockIndex) => input.context.document.children[blockIndex]?.type === "quote",
    );
    const operations = blockIndexes.map((blockIndex) =>
      createSetBlockTypeOperation(
        [blockIndex],
        allSelectedBlocksAreQuotes ? { type: "paragraph" } : { type: "quote" },
      ),
    );

    return createCommandSuccess(TOGGLE_QUOTE_COMMAND_NAME, {
      selection: cloneRangeSelection(selection),
      transaction: createTransaction(operations),
    });
  },
  isActive: isQuoteCommandActive,
  name: TOGGLE_QUOTE_COMMAND_NAME,
};

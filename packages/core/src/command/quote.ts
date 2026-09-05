import { doSelectedBlocksMatch, getSelectedTextBlockIndexes } from "./block-selection";
import { createSelectedBlockTypeCommandSuccess } from "./block-type-result";
import { createCommandSkipped } from "./result";
import type { Command, CommandInput } from "./types";

export const TOGGLE_QUOTE_COMMAND_NAME = "toggleQuote";

export function canExecuteToggleQuoteCommand(input: CommandInput): boolean {
  return getSelectedTextBlockIndexes(input) !== undefined;
}

export function isQuoteCommandActive(input: CommandInput): boolean {
  return doSelectedBlocksMatch(input, (block) => block.type === "quote");
}

export const toggleQuoteCommand: Command = {
  canExecute: canExecuteToggleQuoteCommand,
  execute(input) {
    const result = createSelectedBlockTypeCommandSuccess(
      TOGGLE_QUOTE_COMMAND_NAME,
      input,
      isQuoteCommandActive(input) ? { type: "paragraph" } : { type: "quote" },
    );

    if (result) {
      return result;
    }

    return createCommandSkipped(
      TOGGLE_QUOTE_COMMAND_NAME,
      "Toggle quote command requires a valid text selection.",
    );
  },
  isActive: isQuoteCommandActive,
  name: TOGGLE_QUOTE_COMMAND_NAME,
};

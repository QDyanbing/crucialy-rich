import { createSetBlockTypeOperation, createTransaction } from "../operation";
import { cloneRangeSelection, isValidPoint } from "../selection";
import { createCommandSkipped, createCommandSuccess } from "./result";
import type { Command, CommandInput } from "./types";

export const TOGGLE_QUOTE_COMMAND_NAME = "toggleQuote";

function getSelectedBlockIndex(input: CommandInput): number | undefined {
  const selection = input.context.selection;

  if (
    !selection ||
    !isValidPoint(input.context.document, selection.anchor) ||
    !isValidPoint(input.context.document, selection.focus)
  ) {
    return undefined;
  }

  const anchorBlockIndex = selection.anchor.path[0];
  const focusBlockIndex = selection.focus.path[0];

  return anchorBlockIndex === focusBlockIndex ? anchorBlockIndex : undefined;
}

export function canExecuteToggleQuoteCommand(input: CommandInput): boolean {
  return getSelectedBlockIndex(input) !== undefined;
}

export function isQuoteCommandActive(input: CommandInput): boolean {
  const blockIndex = getSelectedBlockIndex(input);

  return (
    blockIndex !== undefined &&
    input.context.document.children[blockIndex]?.type === "quote"
  );
}

export const toggleQuoteCommand: Command = {
  canExecute: canExecuteToggleQuoteCommand,
  execute(input) {
    const blockIndex = getSelectedBlockIndex(input);
    const selection = input.context.selection;

    if (blockIndex === undefined || !selection) {
      return createCommandSkipped(
        TOGGLE_QUOTE_COMMAND_NAME,
        "Toggle quote command requires a single-block text selection.",
      );
    }

    const block = input.context.document.children[blockIndex];
    const operation = createSetBlockTypeOperation(
      [blockIndex],
      block?.type === "quote" ? { type: "paragraph" } : { type: "quote" },
    );

    return createCommandSuccess(TOGGLE_QUOTE_COMMAND_NAME, {
      selection: cloneRangeSelection(selection),
      transaction: createTransaction([operation]),
    });
  },
  isActive: isQuoteCommandActive,
  name: TOGGLE_QUOTE_COMMAND_NAME,
};

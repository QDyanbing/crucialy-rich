import {
  createSetBlockTypeOperation,
  createTransaction,
  type BlockTypeSpec,
} from "../operation";
import { cloneRangeSelection } from "../selection";
import { getSelectedBlockIndexes } from "./block-selection";
import { createCommandSuccess } from "./result";
import type { CommandInput, CommandName, CommandResult } from "./types";

export function createSelectedBlockTypeCommandSuccess(
  commandName: CommandName,
  input: CommandInput,
  block: BlockTypeSpec,
): CommandResult | undefined {
  const blockIndexes = getSelectedBlockIndexes(input);
  const selection = input.context.selection;

  if (!blockIndexes || !selection) {
    return undefined;
  }

  return createCommandSuccess(commandName, {
    selection: cloneRangeSelection(selection),
    transaction: createTransaction(
      blockIndexes.map((blockIndex) =>
        createSetBlockTypeOperation([blockIndex], block),
      ),
    ),
  });
}

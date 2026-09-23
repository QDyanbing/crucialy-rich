import type { TextMarkAttributes, TextMarkAttributeType } from "../model";
import {
  applyTransaction,
  createSelectionAfterSetMarkAttribute,
  createSetMarkAttributeOperation,
  createTransaction,
} from "../operation";
import { canExecuteTextMarkCommand } from "./mark";
import { createCommandSkipped, createCommandSuccess } from "./result";
import {
  getTextMarkCommandRanges,
  restoreTextMarkCommandSelection,
} from "./text-mark-range";
import type { Command, CommandInput } from "./types";

export interface TextMarkAttributeCommandConfig<
  TAttribute extends TextMarkAttributeType,
> {
  attribute: TAttribute;
  commandName: string;
  invalidReason: string;
  resolveValue: (
    input: CommandInput,
  ) => TextMarkAttributes[TAttribute] | null | undefined;
}

export function canExecuteTextMarkAttributeCommand<
  TAttribute extends TextMarkAttributeType,
>(input: CommandInput, config: TextMarkAttributeCommandConfig<TAttribute>): boolean {
  return canExecuteTextMarkCommand(input) && config.resolveValue(input) !== undefined;
}

export function createTextMarkAttributeCommand<
  TAttribute extends TextMarkAttributeType,
>(config: TextMarkAttributeCommandConfig<TAttribute>): Command {
  return {
    canExecute: (input) => canExecuteTextMarkAttributeCommand(input, config),
    execute(input) {
      const selection = input.context.selection;
      const value = config.resolveValue(input);
      const ranges = selection
        ? getTextMarkCommandRanges(input.context.document, selection)
        : undefined;

      if (!selection || value === undefined || !ranges) {
        return createCommandSkipped(config.commandName, config.invalidReason);
      }

      const operations = ranges.map(({ range }) =>
        createSetMarkAttributeOperation(range, config.attribute, value),
      );
      const transaction = createTransaction(operations);
      const nextSelection =
        ranges.length === 1
          ? createSelectionAfterSetMarkAttribute(input.context.document, operations[0]!)
          : restoreTextMarkCommandSelection(
              input.context.document,
              selection,
              applyTransaction(input.context.document, transaction),
            );

      if (!nextSelection) {
        return createCommandSkipped(config.commandName, config.invalidReason);
      }

      return createCommandSuccess(config.commandName, {
        selection: nextSelection,
        transaction,
      });
    },
    name: config.commandName,
  };
}

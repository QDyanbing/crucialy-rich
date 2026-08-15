import type { TextMarkAttributes, TextMarkAttributeType } from "../model";
import {
  createSelectionAfterSetMarkAttribute,
  createSetMarkAttributeOperation,
  createTransaction,
} from "../operation";
import { normalizeRange } from "../selection";
import { canExecuteTextMarkCommand } from "./mark";
import { createCommandSkipped, createCommandSuccess } from "./result";
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

      if (!selection || value === undefined || !canExecuteTextMarkCommand(input)) {
        return createCommandSkipped(config.commandName, config.invalidReason);
      }

      const operation = createSetMarkAttributeOperation(
        normalizeRange(selection),
        config.attribute,
        value,
      );

      return createCommandSuccess(config.commandName, {
        selection: createSelectionAfterSetMarkAttribute(
          input.context.document,
          operation,
        ),
        transaction: createTransaction([operation]),
      });
    },
    name: config.commandName,
  };
}

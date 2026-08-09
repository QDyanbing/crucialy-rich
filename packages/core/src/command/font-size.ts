import { isValidFontSize } from "../model";
import {
  createSelectionAfterSetMarkAttribute,
  createSetMarkAttributeOperation,
  createTransaction,
} from "../operation";
import { normalizeRange } from "../selection";
import { canExecuteTextMarkCommand } from "./mark";
import { createCommandSkipped, createCommandSuccess } from "./result";
import type { Command, CommandInput } from "./types";

export const SET_FONT_SIZE_COMMAND_NAME = "setFontSize";

export interface SetFontSizeCommandPayload {
  fontSize: number | null;
}

function getFontSizePayload(
  input: CommandInput,
): SetFontSizeCommandPayload | undefined {
  if (
    typeof input.payload !== "object" ||
    input.payload === null ||
    !("fontSize" in input.payload)
  ) {
    return undefined;
  }

  const fontSize = input.payload.fontSize;

  return fontSize === null || isValidFontSize(fontSize) ? { fontSize } : undefined;
}

export function canExecuteSetFontSizeCommand(input: CommandInput): boolean {
  return canExecuteTextMarkCommand(input) && getFontSizePayload(input) !== undefined;
}

export const setFontSizeCommand: Command = {
  canExecute: canExecuteSetFontSizeCommand,
  execute(input) {
    const payload = getFontSizePayload(input);
    const selection = input.context.selection;

    if (!selection || !payload || !canExecuteTextMarkCommand(input)) {
      return createCommandSkipped(
        SET_FONT_SIZE_COMMAND_NAME,
        "Set font size command requires a valid size and text selection.",
      );
    }

    const operation = createSetMarkAttributeOperation(
      normalizeRange(selection),
      "fontSize",
      payload.fontSize,
    );

    return createCommandSuccess(SET_FONT_SIZE_COMMAND_NAME, {
      selection: createSelectionAfterSetMarkAttribute(
        input.context.document,
        operation,
      ),
      transaction: createTransaction([operation]),
    });
  },
  name: SET_FONT_SIZE_COMMAND_NAME,
};

import { sanitizeHexColor } from "../model";
import {
  canExecuteTextMarkAttributeCommand,
  createTextMarkAttributeCommand,
  type TextMarkAttributeCommandConfig,
} from "./attribute";
import type { Command, CommandInput } from "./types";

export const SET_BACKGROUND_COLOR_COMMAND_NAME = "setBackgroundColor";

export interface SetBackgroundColorCommandPayload {
  backgroundColor: string | null;
}

function getBackgroundColorValue(input: CommandInput): string | null | undefined {
  if (
    typeof input.payload !== "object" ||
    input.payload === null ||
    !("backgroundColor" in input.payload)
  ) {
    return undefined;
  }

  const backgroundColor = input.payload.backgroundColor;

  return backgroundColor === null ? null : sanitizeHexColor(backgroundColor);
}

const SET_BACKGROUND_COLOR_COMMAND_CONFIG: TextMarkAttributeCommandConfig<"backgroundColor"> =
  {
    attribute: "backgroundColor",
    commandName: SET_BACKGROUND_COLOR_COMMAND_NAME,
    invalidReason:
      "Set background color command requires a safe color and text selection.",
    resolveValue: getBackgroundColorValue,
  };

export function canExecuteSetBackgroundColorCommand(input: CommandInput): boolean {
  return canExecuteTextMarkAttributeCommand(input, SET_BACKGROUND_COLOR_COMMAND_CONFIG);
}

export const setBackgroundColorCommand: Command = {
  ...createTextMarkAttributeCommand(SET_BACKGROUND_COLOR_COMMAND_CONFIG),
  canExecute: canExecuteSetBackgroundColorCommand,
};

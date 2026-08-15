import { sanitizeHexColor } from "../model";
import {
  canExecuteTextMarkAttributeCommand,
  createTextMarkAttributeCommand,
  type TextMarkAttributeCommandConfig,
} from "./attribute";
import type { Command, CommandInput } from "./types";

export const SET_TEXT_COLOR_COMMAND_NAME = "setTextColor";

export interface SetTextColorCommandPayload {
  textColor: string | null;
}

function getTextColorValue(input: CommandInput): string | null | undefined {
  if (
    typeof input.payload !== "object" ||
    input.payload === null ||
    !("textColor" in input.payload)
  ) {
    return undefined;
  }

  const textColor = input.payload.textColor;

  return textColor === null ? null : sanitizeHexColor(textColor);
}

const SET_TEXT_COLOR_COMMAND_CONFIG: TextMarkAttributeCommandConfig<"textColor"> = {
  attribute: "textColor",
  commandName: SET_TEXT_COLOR_COMMAND_NAME,
  invalidReason: "Set text color command requires a safe color and text selection.",
  resolveValue: getTextColorValue,
};

export function canExecuteSetTextColorCommand(input: CommandInput): boolean {
  return canExecuteTextMarkAttributeCommand(input, SET_TEXT_COLOR_COMMAND_CONFIG);
}

export const setTextColorCommand: Command = {
  ...createTextMarkAttributeCommand(SET_TEXT_COLOR_COMMAND_CONFIG),
  canExecute: canExecuteSetTextColorCommand,
};

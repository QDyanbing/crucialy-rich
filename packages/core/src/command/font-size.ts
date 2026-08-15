import { isValidFontSize } from "../model";
import {
  canExecuteTextMarkAttributeCommand,
  createTextMarkAttributeCommand,
  type TextMarkAttributeCommandConfig,
} from "./attribute";
import type { Command, CommandInput } from "./types";

export const SET_FONT_SIZE_COMMAND_NAME = "setFontSize";

export interface SetFontSizeCommandPayload {
  fontSize: number | null;
}

function getFontSizeValue(input: CommandInput): number | null | undefined {
  if (
    typeof input.payload !== "object" ||
    input.payload === null ||
    !("fontSize" in input.payload)
  ) {
    return undefined;
  }

  const fontSize = input.payload.fontSize;

  return fontSize === null || isValidFontSize(fontSize) ? fontSize : undefined;
}

const SET_FONT_SIZE_COMMAND_CONFIG: TextMarkAttributeCommandConfig<"fontSize"> = {
  attribute: "fontSize",
  commandName: SET_FONT_SIZE_COMMAND_NAME,
  invalidReason: "Set font size command requires a valid size and text selection.",
  resolveValue: getFontSizeValue,
};

export function canExecuteSetFontSizeCommand(input: CommandInput): boolean {
  return canExecuteTextMarkAttributeCommand(input, SET_FONT_SIZE_COMMAND_CONFIG);
}

export const setFontSizeCommand: Command = {
  ...createTextMarkAttributeCommand(SET_FONT_SIZE_COMMAND_CONFIG),
  canExecute: canExecuteSetFontSizeCommand,
};

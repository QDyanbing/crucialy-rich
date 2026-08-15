import { mergeBlockCommand, splitBlockCommand } from "./block";
import { setFontSizeCommand } from "./font-size";
import { BOOLEAN_MARK_COMMANDS } from "./mark";
import { createCommandRegistry, type CommandRegistry } from "./registry";
import { deleteSelectionCommand, insertTextCommand } from "./text";
import { setTextColorCommand } from "./text-color";
import type { Command } from "./types";

export const DEFAULT_COMMANDS: readonly Command[] = [
  ...BOOLEAN_MARK_COMMANDS,
  setFontSizeCommand,
  setTextColorCommand,
  deleteSelectionCommand,
  insertTextCommand,
  mergeBlockCommand,
  splitBlockCommand,
];

export function createDefaultCommandRegistry(): CommandRegistry {
  return createCommandRegistry([...DEFAULT_COMMANDS]);
}

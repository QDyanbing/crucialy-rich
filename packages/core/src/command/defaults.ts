import { mergeBlockCommand, splitBlockCommand } from "./block";
import { boldCommand, italicCommand, strikeCommand, underlineCommand } from "./mark";
import { createCommandRegistry, type CommandRegistry } from "./registry";
import { deleteSelectionCommand, insertTextCommand } from "./text";
import type { Command } from "./types";

export const DEFAULT_COMMANDS: readonly Command[] = [
  boldCommand,
  deleteSelectionCommand,
  insertTextCommand,
  italicCommand,
  mergeBlockCommand,
  splitBlockCommand,
  strikeCommand,
  underlineCommand,
];

export function createDefaultCommandRegistry(): CommandRegistry {
  return createCommandRegistry([...DEFAULT_COMMANDS]);
}

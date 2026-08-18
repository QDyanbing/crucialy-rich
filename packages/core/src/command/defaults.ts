import { mergeBlockCommand, splitBlockCommand } from "./block";
import { BOOLEAN_MARK_COMMANDS } from "./mark";
import { createCommandRegistry, type CommandRegistry } from "./registry";
import { deleteSelectionCommand, insertTextCommand } from "./text";
import { TEXT_STYLE_COMMANDS } from "./text-style";
import type { Command } from "./types";

export const DEFAULT_COMMANDS: readonly Command[] = [
  ...BOOLEAN_MARK_COMMANDS,
  ...TEXT_STYLE_COMMANDS,
  deleteSelectionCommand,
  insertTextCommand,
  mergeBlockCommand,
  splitBlockCommand,
];

export function createDefaultCommandRegistry(): CommandRegistry {
  return createCommandRegistry([...DEFAULT_COMMANDS]);
}

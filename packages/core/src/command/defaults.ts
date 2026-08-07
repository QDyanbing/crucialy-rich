import { mergeBlockCommand, splitBlockCommand } from "./block";
import { BOOLEAN_MARK_COMMANDS } from "./mark";
import { createCommandRegistry, type CommandRegistry } from "./registry";
import { deleteSelectionCommand, insertTextCommand } from "./text";
import type { Command } from "./types";

export const DEFAULT_COMMANDS: readonly Command[] = [
  ...BOOLEAN_MARK_COMMANDS,
  deleteSelectionCommand,
  insertTextCommand,
  mergeBlockCommand,
  splitBlockCommand,
];

export function createDefaultCommandRegistry(): CommandRegistry {
  return createCommandRegistry([...DEFAULT_COMMANDS]);
}

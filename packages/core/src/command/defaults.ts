import { mergeBlockCommand, splitBlockCommand } from "./block";
import { boldCommand } from "./mark";
import { createCommandRegistry, type CommandRegistry } from "./registry";
import { deleteSelectionCommand, insertTextCommand } from "./text";
import type { Command } from "./types";

export const DEFAULT_COMMANDS: readonly Command[] = [
  boldCommand,
  deleteSelectionCommand,
  insertTextCommand,
  mergeBlockCommand,
  splitBlockCommand,
];

export function createDefaultCommandRegistry(): CommandRegistry {
  return createCommandRegistry([...DEFAULT_COMMANDS]);
}

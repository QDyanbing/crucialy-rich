import { mergeBlockCommand, splitBlockCommand } from "./block";
import { createCommandRegistry, type CommandRegistry } from "./registry";
import { deleteSelectionCommand, insertTextCommand } from "./text";
import type { Command } from "./types";

export const DEFAULT_COMMANDS: readonly Command[] = [
  deleteSelectionCommand,
  insertTextCommand,
  mergeBlockCommand,
  splitBlockCommand,
];

export function createDefaultCommandRegistry(): CommandRegistry {
  return createCommandRegistry([...DEFAULT_COMMANDS]);
}

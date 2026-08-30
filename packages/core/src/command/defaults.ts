import { mergeBlockCommand, splitBlockCommand } from "./block";
import { BLOCK_TYPE_COMMANDS } from "./block-type";
import { BOOLEAN_MARK_COMMANDS } from "./mark";
import { createCommandRegistry, type CommandRegistry } from "./registry";
import { LINK_COMMANDS } from "./link";
import { deleteSelectionCommand, insertTextCommand } from "./text";
import { TEXT_STYLE_COMMANDS } from "./text-style";
import type { Command } from "./types";

export const DEFAULT_COMMANDS: readonly Command[] = [
  ...BOOLEAN_MARK_COMMANDS,
  ...TEXT_STYLE_COMMANDS,
  ...LINK_COMMANDS,
  ...BLOCK_TYPE_COMMANDS,
  deleteSelectionCommand,
  insertTextCommand,
  mergeBlockCommand,
  splitBlockCommand,
];

export function createDefaultCommandRegistry(): CommandRegistry {
  return createCommandRegistry([...DEFAULT_COMMANDS]);
}

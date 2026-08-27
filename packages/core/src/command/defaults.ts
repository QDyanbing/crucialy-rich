import { mergeBlockCommand, splitBlockCommand } from "./block";
import { BOOLEAN_MARK_COMMANDS } from "./mark";
import { setHeadingCommand } from "./heading";
import { createCommandRegistry, type CommandRegistry } from "./registry";
import { LINK_COMMANDS } from "./link";
import { deleteSelectionCommand, insertTextCommand } from "./text";
import { TEXT_STYLE_COMMANDS } from "./text-style";
import type { Command } from "./types";

export const DEFAULT_COMMANDS: readonly Command[] = [
  ...BOOLEAN_MARK_COMMANDS,
  ...TEXT_STYLE_COMMANDS,
  ...LINK_COMMANDS,
  setHeadingCommand,
  deleteSelectionCommand,
  insertTextCommand,
  mergeBlockCommand,
  splitBlockCommand,
];

export function createDefaultCommandRegistry(): CommandRegistry {
  return createCommandRegistry([...DEFAULT_COMMANDS]);
}

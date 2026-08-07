import type { CommandName } from "./types";
import { BOLD_COMMAND_NAME, ITALIC_COMMAND_NAME, UNDERLINE_COMMAND_NAME } from "./mark";

export interface CommandShortcutBinding {
  readonly altKey?: boolean;
  readonly commandName: CommandName;
  readonly key: string;
  readonly shiftKey?: boolean;
}

export interface CommandShortcutInput {
  readonly altKey?: boolean;
  readonly code?: string;
  readonly ctrlKey?: boolean;
  readonly isComposing?: boolean;
  readonly key: string;
  readonly metaKey?: boolean;
  readonly shiftKey?: boolean;
}

export const DEFAULT_COMMAND_SHORTCUTS: readonly CommandShortcutBinding[] = [
  { commandName: BOLD_COMMAND_NAME, key: "b" },
  { commandName: ITALIC_COMMAND_NAME, key: "i" },
  { commandName: UNDERLINE_COMMAND_NAME, key: "u" },
];

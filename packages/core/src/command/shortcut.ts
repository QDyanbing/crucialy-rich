import type { CommandName } from "./types";
import { BOLD_COMMAND_NAME, ITALIC_COMMAND_NAME, UNDERLINE_COMMAND_NAME } from "./mark";

export interface CommandShortcutBinding {
  readonly altKey?: boolean;
  readonly commandName: CommandName;
  readonly key: string;
  readonly payload?: unknown;
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

export function getCommandShortcuts(
  commandName: CommandName,
  shortcuts: readonly CommandShortcutBinding[] = DEFAULT_COMMAND_SHORTCUTS,
): readonly CommandShortcutBinding[] {
  return shortcuts.filter((shortcut) => shortcut.commandName === commandName);
}

function isShortcutKey(
  input: CommandShortcutInput,
  shortcut: CommandShortcutBinding,
): boolean {
  const shortcutKey = shortcut.key.toLowerCase();
  const shortcutCode = /^[a-z]$/.test(shortcutKey)
    ? `key${shortcutKey}`
    : /^\d$/.test(shortcutKey)
      ? `digit${shortcutKey}`
      : undefined;

  return (
    input.key.toLowerCase() === shortcutKey ||
    (shortcutCode !== undefined && input.code?.toLowerCase() === shortcutCode)
  );
}

function matchesCommandShortcut(
  input: CommandShortcutInput,
  shortcut: CommandShortcutBinding,
): boolean {
  if (input.isComposing || (!input.ctrlKey && !input.metaKey)) {
    return false;
  }

  return (
    Boolean(input.altKey) === Boolean(shortcut.altKey) &&
    Boolean(input.shiftKey) === Boolean(shortcut.shiftKey) &&
    isShortcutKey(input, shortcut)
  );
}

export function getCommandNameFromShortcut(
  input: CommandShortcutInput,
  shortcuts: readonly CommandShortcutBinding[] = DEFAULT_COMMAND_SHORTCUTS,
): CommandName | undefined {
  return getCommandShortcutFromInput(input, shortcuts)?.commandName;
}

export function getCommandShortcutFromInput(
  input: CommandShortcutInput,
  shortcuts: readonly CommandShortcutBinding[] = DEFAULT_COMMAND_SHORTCUTS,
): CommandShortcutBinding | undefined {
  return shortcuts.find((shortcut) => matchesCommandShortcut(input, shortcut));
}

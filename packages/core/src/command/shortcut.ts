import type { CommandName } from "./types";
import { SET_HEADING_COMMAND_NAME } from "./heading";
import {
  TOGGLE_BULLET_LIST_COMMAND_NAME,
  TOGGLE_ORDERED_LIST_COMMAND_NAME,
} from "./list";
import { TOGGLE_QUOTE_COMMAND_NAME } from "./quote";
import {
  BOLD_COMMAND_NAME,
  ITALIC_COMMAND_NAME,
  STRIKE_COMMAND_NAME,
  UNDERLINE_COMMAND_NAME,
} from "./mark";

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
  { commandName: STRIKE_COMMAND_NAME, key: "x", shiftKey: true },
  {
    altKey: true,
    commandName: SET_HEADING_COMMAND_NAME,
    key: "0",
    payload: { level: null },
  },
  {
    altKey: true,
    commandName: SET_HEADING_COMMAND_NAME,
    key: "1",
    payload: { level: 1 },
  },
  {
    altKey: true,
    commandName: SET_HEADING_COMMAND_NAME,
    key: "2",
    payload: { level: 2 },
  },
  {
    altKey: true,
    commandName: SET_HEADING_COMMAND_NAME,
    key: "3",
    payload: { level: 3 },
  },
  {
    altKey: true,
    commandName: SET_HEADING_COMMAND_NAME,
    key: "4",
    payload: { level: 4 },
  },
  {
    altKey: true,
    commandName: SET_HEADING_COMMAND_NAME,
    key: "5",
    payload: { level: 5 },
  },
  {
    altKey: true,
    commandName: SET_HEADING_COMMAND_NAME,
    key: "6",
    payload: { level: 6 },
  },
  { commandName: TOGGLE_ORDERED_LIST_COMMAND_NAME, key: "7", shiftKey: true },
  { commandName: TOGGLE_BULLET_LIST_COMMAND_NAME, key: "8", shiftKey: true },
  { commandName: TOGGLE_QUOTE_COMMAND_NAME, key: "9", shiftKey: true },
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

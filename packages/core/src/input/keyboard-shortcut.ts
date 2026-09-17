import {
  getCommandNameFromShortcut,
  type CommandName,
  type CommandShortcutInput,
} from "../command";
import { getHistoryShortcutAction, type HistoryShortcutAction } from "../history";

export type EditorShortcutAction =
  | { commandName: CommandName; type: "command" }
  | { action: HistoryShortcutAction; type: "history" };

export function getEditorShortcutAction(
  input: CommandShortcutInput,
): EditorShortcutAction | undefined {
  const historyAction = getHistoryShortcutAction(input);

  if (historyAction) {
    return { action: historyAction, type: "history" };
  }

  const commandName = getCommandNameFromShortcut(input);

  return commandName ? { commandName, type: "command" } : undefined;
}

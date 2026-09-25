import {
  getCommandShortcutFromInput,
  type CommandName,
  type CommandShortcutInput,
} from "../command";
import { getHistoryShortcutAction, type HistoryShortcutAction } from "../history";

export type EditorShortcutAction =
  | { commandName: CommandName; payload?: unknown; type: "command" }
  | { action: HistoryShortcutAction; type: "history" };

export function getEditorShortcutAction(
  input: CommandShortcutInput,
): EditorShortcutAction | undefined {
  const historyAction = getHistoryShortcutAction(input);

  if (historyAction) {
    return { action: historyAction, type: "history" };
  }

  const shortcut = getCommandShortcutFromInput(input);

  return shortcut
    ? {
        commandName: shortcut.commandName,
        ...(shortcut.payload === undefined ? {} : { payload: shortcut.payload }),
        type: "command",
      }
    : undefined;
}

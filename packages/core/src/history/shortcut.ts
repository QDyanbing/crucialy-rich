export type HistoryShortcutAction = "redo" | "undo";

export interface HistoryShortcutInput {
  altKey?: boolean;
  code?: string;
  ctrlKey?: boolean;
  isComposing?: boolean;
  key: string;
  metaKey?: boolean;
  shiftKey?: boolean;
}

function isShortcutKey(input: HistoryShortcutInput, key: "y" | "z"): boolean {
  return input.key.toLowerCase() === key || input.code === `Key${key.toUpperCase()}`;
}

export function getHistoryShortcutAction(
  input: HistoryShortcutInput,
): HistoryShortcutAction | undefined {
  if (input.altKey || input.isComposing || (!input.ctrlKey && !input.metaKey)) {
    return undefined;
  }

  if (isShortcutKey(input, "z")) {
    return input.shiftKey ? "redo" : "undo";
  }

  if (isShortcutKey(input, "y") && !input.shiftKey) {
    return "redo";
  }

  return undefined;
}

export type SlashMenuKeyboardAction = "close" | "next" | "previous" | "select";

export function getSlashMenuKeyboardAction(
  key: string,
): SlashMenuKeyboardAction | undefined {
  return key === "Escape" ? "close" : undefined;
}

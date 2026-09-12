export type SlashMenuKeyboardAction = "close" | "next" | "previous" | "select";

export type SlashMenuNavigationDirection = "next" | "previous";

export function getNextSlashMenuIndex(
  activeIndex: number,
  direction: SlashMenuNavigationDirection,
  itemCount: number,
): number {
  if (!Number.isInteger(itemCount) || itemCount <= 0) {
    return -1;
  }

  const normalizedIndex =
    Number.isInteger(activeIndex) && activeIndex >= 0 && activeIndex < itemCount
      ? activeIndex
      : 0;

  return direction === "next"
    ? (normalizedIndex + 1) % itemCount
    : (normalizedIndex - 1 + itemCount) % itemCount;
}

export function getSlashMenuKeyboardAction(
  key: string,
): SlashMenuKeyboardAction | undefined {
  return key === "Escape" ? "close" : undefined;
}

import type { SlashCommandItem, SlashMenuState, SlashMenuTrigger } from "./types";
import { getNextSlashMenuIndex, type SlashMenuNavigationDirection } from "./keyboard";
import { cloneSlashMenuTrigger } from "./snapshot";

export function createClosedSlashMenuState(): SlashMenuState {
  return { activeIndex: 0, open: false };
}

export function openSlashMenu(trigger: SlashMenuTrigger): SlashMenuState {
  return {
    activeIndex: 0,
    open: true,
    trigger: cloneSlashMenuTrigger(trigger),
  };
}

export function closeSlashMenu(): SlashMenuState {
  return createClosedSlashMenuState();
}

export function moveSlashMenuSelection(
  state: SlashMenuState,
  direction: SlashMenuNavigationDirection,
  itemCount: number,
): SlashMenuState {
  if (!state.open || itemCount <= 0) {
    return state;
  }

  return {
    ...state,
    activeIndex: getNextSlashMenuIndex(state.activeIndex, direction, itemCount),
  };
}

export function getActiveSlashCommandItem(
  items: readonly SlashCommandItem[],
  activeIndex: number,
): SlashCommandItem | undefined {
  return Number.isInteger(activeIndex) && activeIndex >= 0
    ? items[activeIndex]
    : undefined;
}

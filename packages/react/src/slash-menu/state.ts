import type { SlashMenuState, SlashMenuTrigger } from "./types";
import { getNextSlashMenuIndex, type SlashMenuNavigationDirection } from "./keyboard";

function cloneTrigger(trigger: SlashMenuTrigger): SlashMenuTrigger {
  return {
    ...trigger,
    range: {
      anchor: {
        offset: trigger.range.anchor.offset,
        path: [...trigger.range.anchor.path],
      },
      focus: {
        offset: trigger.range.focus.offset,
        path: [...trigger.range.focus.path],
      },
    },
  };
}

export function createClosedSlashMenuState(): SlashMenuState {
  return { activeIndex: 0, open: false };
}

export function openSlashMenu(trigger: SlashMenuTrigger): SlashMenuState {
  return {
    activeIndex: 0,
    open: true,
    trigger: cloneTrigger(trigger),
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

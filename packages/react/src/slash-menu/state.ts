import type { SlashMenuState, SlashMenuTrigger } from "./types";

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

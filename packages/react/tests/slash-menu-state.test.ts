import { describe, expect, it } from "vitest";

import {
  closeSlashMenu,
  createClosedSlashMenuState,
  getActiveSlashCommandItem,
  moveSlashMenuSelection,
  openSlashMenu,
} from "../src/slash-menu/state";
import type { SlashMenuTrigger } from "../src/slash-menu/types";

const trigger: SlashMenuTrigger = {
  query: "he",
  range: {
    anchor: { offset: 0, path: [0, 0] },
    focus: { offset: 3, path: [0, 0] },
  },
  text: "/he",
};

describe("slash menu state", () => {
  it("creates a closed initial state", () => {
    expect(createClosedSlashMenuState()).toEqual({ activeIndex: 0, open: false });
  });

  it("opens with an isolated trigger snapshot", () => {
    const state = openSlashMenu(trigger);

    expect(state).toEqual({ activeIndex: 0, open: true, trigger });
    expect(state.trigger).not.toBe(trigger);
    expect(state.trigger?.range.anchor.path).not.toBe(trigger.range.anchor.path);
  });

  it("closes without retaining the previous trigger", () => {
    expect(closeSlashMenu()).toEqual({ activeIndex: 0, open: false });
  });

  it("moves the active selection while open", () => {
    const state = openSlashMenu(trigger);

    expect(moveSlashMenuSelection(state, "previous", 3)).toMatchObject({
      activeIndex: 2,
      open: true,
    });
    expect(moveSlashMenuSelection(state, "next", 3)).toMatchObject({
      activeIndex: 1,
      open: true,
    });
  });

  it("leaves closed or empty state unchanged", () => {
    const closedState = closeSlashMenu();
    const openState = openSlashMenu(trigger);

    expect(moveSlashMenuSelection(closedState, "next", 3)).toBe(closedState);
    expect(moveSlashMenuSelection(openState, "next", 0)).toBe(openState);
  });

  it("keeps navigation branches and their trigger endpoints independent", () => {
    const opened = openSlashMenu(trigger);
    const first = moveSlashMenuSelection(opened, "next", 3);
    const sibling = moveSlashMenuSelection(opened, "previous", 3);
    const next = moveSlashMenuSelection(first, "next", 3);
    first.trigger!.range.anchor.path[0] = 99;
    first.trigger!.range.focus.offset = 99;
    first.trigger!.query = "changed";
    expect(opened.trigger).toEqual(trigger);
    expect(sibling.trigger).toEqual(trigger);
    expect(next.trigger).toEqual(trigger);
    expect(next.activeIndex).toBe(2);
    next.trigger!.range.focus.path[0] = 88;
    expect(next.trigger!.range.anchor.path).toEqual([0, 0]);
  });

  it("can navigate an open state without inventing a missing trigger", () => {
    expect(moveSlashMenuSelection({ open: true, activeIndex: 0 }, "next", 2)).toEqual({
      open: true,
      activeIndex: 1,
    });
  });

  it("resolves only a valid active item", () => {
    const items = [
      { commandName: "setHeading", id: "heading", label: "标题" },
      { commandName: "toggleQuote", id: "quote", label: "引用" },
    ];

    expect(getActiveSlashCommandItem(items, 1)).toBe(items[1]);
    expect(getActiveSlashCommandItem(items, -1)).toBeUndefined();
    expect(getActiveSlashCommandItem(items, 2)).toBeUndefined();
    expect(getActiveSlashCommandItem([], 0)).toBeUndefined();
  });
});

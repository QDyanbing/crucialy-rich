import { describe, expect, it } from "vitest";

import {
  getNextSlashMenuIndex,
  getSlashMenuKeyboardAction,
} from "../src/slash-menu/keyboard";

describe("getNextSlashMenuIndex", () => {
  it("moves in both directions", () => {
    expect(getNextSlashMenuIndex(1, "next", 4)).toBe(2);
    expect(getNextSlashMenuIndex(2, "previous", 4)).toBe(1);
  });

  it("wraps around list boundaries", () => {
    expect(getNextSlashMenuIndex(3, "next", 4)).toBe(0);
    expect(getNextSlashMenuIndex(0, "previous", 4)).toBe(3);
  });

  it("normalizes an invalid active index", () => {
    expect(getNextSlashMenuIndex(9, "next", 3)).toBe(1);
    expect(getNextSlashMenuIndex(-1, "previous", 3)).toBe(2);
  });

  it.each([0, -1, 1.5])("returns -1 for invalid item count %s", (itemCount) => {
    expect(getNextSlashMenuIndex(0, "next", itemCount)).toBe(-1);
  });
});

describe("getSlashMenuKeyboardAction", () => {
  it.each([
    ["Escape", "close"],
    ["ArrowDown", "next"],
    ["ArrowUp", "previous"],
    ["Enter", "select"],
  ] as const)("maps %s to %s", (key, action) => {
    expect(getSlashMenuKeyboardAction(key)).toBe(action);
  });

  it.each(["Tab", "ArrowLeft", "ArrowRight", "Backspace", "a"])(
    "does not claim the editor key %s",
    (key) => {
      expect(getSlashMenuKeyboardAction(key)).toBeUndefined();
    },
  );
});

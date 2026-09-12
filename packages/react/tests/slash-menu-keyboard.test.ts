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
  it("maps Escape to menu close", () => {
    expect(getSlashMenuKeyboardAction("Escape")).toBe("close");
  });

  it.each(["Enter", "ArrowUp", "ArrowDown", "Tab", "a"])(
    "does not claim %s before navigation is enabled",
    (key) => {
      expect(getSlashMenuKeyboardAction(key)).toBeUndefined();
    },
  );
});

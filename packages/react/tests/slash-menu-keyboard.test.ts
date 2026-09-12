import { describe, expect, it } from "vitest";

import { getSlashMenuKeyboardAction } from "../src/slash-menu/keyboard";

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

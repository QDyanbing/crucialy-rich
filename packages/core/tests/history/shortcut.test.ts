import { describe, expect, it } from "vitest";

import { getHistoryShortcutAction } from "../../src";

describe("getHistoryShortcutAction", () => {
  it("maps Ctrl+Z and Meta+Z to undo", () => {
    expect(getHistoryShortcutAction({ ctrlKey: true, key: "z" })).toBe("undo");
    expect(getHistoryShortcutAction({ key: "Z", metaKey: true })).toBe("undo");
    expect(getHistoryShortcutAction({ code: "KeyZ", ctrlKey: true, key: "" })).toBe(
      "undo",
    );
  });
});

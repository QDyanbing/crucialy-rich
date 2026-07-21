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

  it("maps shifted Z and plain Y shortcuts to redo", () => {
    expect(getHistoryShortcutAction({ ctrlKey: true, key: "z", shiftKey: true })).toBe(
      "redo",
    );
    expect(getHistoryShortcutAction({ key: "Z", metaKey: true, shiftKey: true })).toBe(
      "redo",
    );
    expect(getHistoryShortcutAction({ ctrlKey: true, key: "y" })).toBe("redo");
    expect(getHistoryShortcutAction({ code: "KeyY", key: "", metaKey: true })).toBe(
      "redo",
    );
  });
});

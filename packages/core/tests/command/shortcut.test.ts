import { describe, expect, it } from "vitest";

import {
  BOLD_COMMAND_NAME,
  DEFAULT_COMMAND_SHORTCUTS,
  getCommandNameFromShortcut,
  getCommandShortcuts,
  ITALIC_COMMAND_NAME,
  STRIKE_COMMAND_NAME,
  UNDERLINE_COMMAND_NAME,
} from "../../src";

describe("command shortcut config", () => {
  it("provides the planned boolean mark shortcuts", () => {
    expect(DEFAULT_COMMAND_SHORTCUTS).toEqual([
      { commandName: BOLD_COMMAND_NAME, key: "b" },
      { commandName: ITALIC_COMMAND_NAME, key: "i" },
      { commandName: UNDERLINE_COMMAND_NAME, key: "u" },
    ]);
  });

  it("queries bindings by command name", () => {
    expect(getCommandShortcuts(BOLD_COMMAND_NAME)).toEqual([
      { commandName: BOLD_COMMAND_NAME, key: "b" },
    ]);
    expect(getCommandShortcuts(STRIKE_COMMAND_NAME)).toEqual([]);
  });

  it("resolves Ctrl and Meta mark shortcuts", () => {
    expect(getCommandNameFromShortcut({ ctrlKey: true, key: "b" })).toBe(
      BOLD_COMMAND_NAME,
    );
    expect(getCommandNameFromShortcut({ key: "I", metaKey: true })).toBe(
      ITALIC_COMMAND_NAME,
    );
    expect(getCommandNameFromShortcut({ code: "KeyU", ctrlKey: true, key: "" })).toBe(
      UNDERLINE_COMMAND_NAME,
    );
  });

  it("ignores unmatched modifiers and composing input", () => {
    expect(getCommandNameFromShortcut({ key: "b" })).toBeUndefined();
    expect(
      getCommandNameFromShortcut({ altKey: true, ctrlKey: true, key: "b" }),
    ).toBeUndefined();
    expect(
      getCommandNameFromShortcut({ ctrlKey: true, key: "b", shiftKey: true }),
    ).toBeUndefined();
    expect(
      getCommandNameFromShortcut({ ctrlKey: true, isComposing: true, key: "b" }),
    ).toBeUndefined();
  });

  it("supports host-provided shortcut tables", () => {
    const shortcuts = [
      { commandName: STRIKE_COMMAND_NAME, key: "x", shiftKey: true },
    ] as const;

    expect(getCommandShortcuts(STRIKE_COMMAND_NAME, shortcuts)).toEqual(shortcuts);
    expect(
      getCommandNameFromShortcut(
        { key: "x", metaKey: true, shiftKey: true },
        shortcuts,
      ),
    ).toBe(STRIKE_COMMAND_NAME);
    expect(
      getCommandNameFromShortcut({ key: "x", metaKey: true }, shortcuts),
    ).toBeUndefined();
  });
});

import { describe, expect, it } from "vitest";

import {
  BOLD_COMMAND_NAME,
  DEFAULT_COMMAND_SHORTCUTS,
  getCommandNameFromShortcut,
  getCommandShortcutFromInput,
  getCommandShortcuts,
  ITALIC_COMMAND_NAME,
  SET_HEADING_COMMAND_NAME,
  STRIKE_COMMAND_NAME,
  TOGGLE_QUOTE_COMMAND_NAME,
  UNDERLINE_COMMAND_NAME,
} from "../../src";

describe("command shortcut config", () => {
  it("provides the planned boolean mark shortcuts", () => {
    expect(DEFAULT_COMMAND_SHORTCUTS).toEqual([
      { commandName: BOLD_COMMAND_NAME, key: "b" },
      { commandName: ITALIC_COMMAND_NAME, key: "i" },
      { commandName: UNDERLINE_COMMAND_NAME, key: "u" },
      { commandName: STRIKE_COMMAND_NAME, key: "x", shiftKey: true },
      ...Array.from({ length: 7 }, (_, level) => ({
        altKey: true,
        commandName: SET_HEADING_COMMAND_NAME,
        key: String(level),
        payload: { level: level === 0 ? null : level },
      })),
      { commandName: TOGGLE_QUOTE_COMMAND_NAME, key: "9", shiftKey: true },
    ]);
  });

  it("queries bindings by command name", () => {
    expect(getCommandShortcuts(BOLD_COMMAND_NAME)).toEqual([
      { commandName: BOLD_COMMAND_NAME, key: "b" },
    ]);
    expect(getCommandShortcuts(STRIKE_COMMAND_NAME)).toEqual([
      { commandName: STRIKE_COMMAND_NAME, key: "x", shiftKey: true },
    ]);
    expect(getCommandShortcuts(SET_HEADING_COMMAND_NAME)).toHaveLength(7);
    expect(getCommandShortcuts(TOGGLE_QUOTE_COMMAND_NAME)).toEqual([
      { commandName: TOGGLE_QUOTE_COMMAND_NAME, key: "9", shiftKey: true },
    ]);
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
    expect(
      getCommandNameFromShortcut({ key: "X", metaKey: true, shiftKey: true }),
    ).toBe(STRIKE_COMMAND_NAME);
    expect(
      getCommandShortcutFromInput({ altKey: true, ctrlKey: true, key: "3" }),
    ).toMatchObject({
      commandName: SET_HEADING_COMMAND_NAME,
      payload: { level: 3 },
    });
    expect(
      getCommandNameFromShortcut({
        code: "Digit9",
        metaKey: true,
        key: "",
        shiftKey: true,
      }),
    ).toBe(TOGGLE_QUOTE_COMMAND_NAME);
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

  it("returns the payload from a matched shortcut binding", () => {
    const payload = { level: 2 };
    const shortcuts = [
      {
        altKey: true,
        commandName: "setHeading",
        key: "2",
        payload,
      },
    ] as const;

    expect(
      getCommandShortcutFromInput({ altKey: true, ctrlKey: true, key: "2" }, shortcuts),
    ).toEqual(shortcuts[0]);
    expect(
      getCommandShortcutFromInput(
        { altKey: true, code: "Digit2", metaKey: true, key: "" },
        shortcuts,
      ),
    ).toEqual(shortcuts[0]);
  });
});

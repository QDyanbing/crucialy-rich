import { describe, expect, it } from "vitest";

import {
  BOLD_COMMAND_NAME,
  getEditorShortcutAction,
  ITALIC_COMMAND_NAME,
  SET_HEADING_COMMAND_NAME,
  STRIKE_COMMAND_NAME,
  TOGGLE_BULLET_LIST_COMMAND_NAME,
  TOGGLE_ORDERED_LIST_COMMAND_NAME,
  TOGGLE_QUOTE_COMMAND_NAME,
  UNDERLINE_COMMAND_NAME,
} from "../../src";

describe("getEditorShortcutAction", () => {
  it("resolves formatting shortcuts", () => {
    expect(getEditorShortcutAction({ key: "b", metaKey: true })).toEqual({
      commandName: BOLD_COMMAND_NAME,
      type: "command",
    });
    expect(getEditorShortcutAction({ ctrlKey: true, key: "i" })).toEqual({
      commandName: ITALIC_COMMAND_NAME,
      type: "command",
    });
    expect(getEditorShortcutAction({ ctrlKey: true, key: "u" })).toEqual({
      commandName: UNDERLINE_COMMAND_NAME,
      type: "command",
    });
    expect(
      getEditorShortcutAction({ key: "x", metaKey: true, shiftKey: true }),
    ).toEqual({ commandName: STRIKE_COMMAND_NAME, type: "command" });
    expect(
      getEditorShortcutAction({ altKey: true, code: "Digit2", ctrlKey: true, key: "" }),
    ).toEqual({
      commandName: SET_HEADING_COMMAND_NAME,
      payload: { level: 2 },
      type: "command",
    });
    expect(
      getEditorShortcutAction({ ctrlKey: true, key: "9", shiftKey: true }),
    ).toEqual({ commandName: TOGGLE_QUOTE_COMMAND_NAME, type: "command" });
    expect(
      getEditorShortcutAction({
        code: "Digit7",
        key: "",
        metaKey: true,
        shiftKey: true,
      }),
    ).toEqual({ commandName: TOGGLE_ORDERED_LIST_COMMAND_NAME, type: "command" });
    expect(
      getEditorShortcutAction({ ctrlKey: true, key: "8", shiftKey: true }),
    ).toEqual({ commandName: TOGGLE_BULLET_LIST_COMMAND_NAME, type: "command" });
  });

  it("resolves undo and redo shortcuts before command shortcuts", () => {
    expect(getEditorShortcutAction({ key: "z", metaKey: true })).toEqual({
      action: "undo",
      type: "history",
    });
    expect(
      getEditorShortcutAction({ key: "z", metaKey: true, shiftKey: true }),
    ).toEqual({ action: "redo", type: "history" });
    expect(getEditorShortcutAction({ ctrlKey: true, key: "y" })).toEqual({
      action: "redo",
      type: "history",
    });
  });

  it("ignores browser-like conflicts and composition keys", () => {
    expect(getEditorShortcutAction({ key: "b" })).toBeUndefined();
    expect(
      getEditorShortcutAction({ altKey: true, ctrlKey: true, key: "b" }),
    ).toBeUndefined();
    expect(
      getEditorShortcutAction({ ctrlKey: true, isComposing: true, key: "b" }),
    ).toBeUndefined();
  });
});

import { describe, expect, it } from "vitest";

import {
  BOLD_COMMAND_NAME,
  DEFAULT_COMMAND_SHORTCUTS,
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
});

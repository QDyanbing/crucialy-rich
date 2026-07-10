import { describe, expect, it } from "vitest";

import {
  createCommandRegistry,
  createCommandSuccess,
  createDocument,
  executeCommand,
  type Command,
} from "../../src";

const context = {
  document: createDocument(),
};

function createCommand(command: Partial<Command> = {}): Command {
  return {
    execute: () => createCommandSuccess("noop"),
    name: "noop",
    ...command,
  };
}

describe("executeCommand", () => {
  it("executes a command by name", () => {
    const registry = createCommandRegistry([createCommand()]);

    expect(executeCommand(registry, "noop", { context })).toEqual({
      commandName: "noop",
      ok: true,
      status: "success",
    });
  });

  it("returns a failure for missing commands", () => {
    const registry = createCommandRegistry();

    expect(executeCommand(registry, "missing", { context })).toEqual({
      commandName: "missing",
      ok: false,
      reason: "Command is not registered.",
      status: "failure",
    });
  });
});

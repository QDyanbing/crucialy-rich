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

  it("returns skipped when canExecute blocks the command", () => {
    const registry = createCommandRegistry([
      createCommand({ canExecute: () => false }),
    ]);

    expect(executeCommand(registry, "noop", { context })).toEqual({
      commandName: "noop",
      ok: false,
      reason: "Command cannot execute in the current context.",
      status: "skipped",
    });
  });

  it("returns failure when a command throws", () => {
    const registry = createCommandRegistry([
      createCommand({
        execute: () => {
          throw new Error("Broken command.");
        },
      }),
    ]);

    expect(executeCommand(registry, "noop", { context })).toEqual({
      commandName: "noop",
      ok: false,
      reason: "Broken command.",
      status: "failure",
    });
  });
});

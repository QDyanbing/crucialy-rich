import { describe, expect, it, vi } from "vitest";

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
  it.each([new Error("Guard failed."), "guard", null, Symbol("guard")])(
    "returns failure without executing when canExecute throws %s",
    (error) => {
      const execute = vi.fn(() => createCommandSuccess("noop"));
      const registry = createCommandRegistry([
        createCommand({
          canExecute: () => {
            throw error;
          },
          execute,
        }),
      ]);
      const before = structuredClone(context.document);
      expect(executeCommand(registry, "noop", { context })).toEqual({
        commandName: "noop",
        ok: false,
        status: "failure",
        reason: error instanceof Error ? error.message : "Command execution failed.",
      });
      expect(execute).not.toHaveBeenCalled();
      expect(context.document).toEqual(before);
    },
  );
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

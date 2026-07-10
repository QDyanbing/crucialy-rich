import { describe, expect, it } from "vitest";

import {
  canExecuteCommand,
  createCommandRegistry,
  createCommandSuccess,
  createDocument,
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

describe("canExecuteCommand", () => {
  it("returns false for a missing command", () => {
    const registry = createCommandRegistry();

    expect(canExecuteCommand(registry, "missing", { context })).toBe(false);
  });

  it("returns true when a command has no guard", () => {
    const registry = createCommandRegistry([createCommand()]);

    expect(canExecuteCommand(registry, "noop", { context })).toBe(true);
  });

  it("returns the command guard result", () => {
    const registry = createCommandRegistry([
      createCommand({ canExecute: () => false }),
    ]);

    expect(canExecuteCommand(registry, "noop", { context })).toBe(false);

    registry.register(createCommand({ canExecute: () => true }));

    expect(canExecuteCommand(registry, "noop", { context })).toBe(true);
  });
});

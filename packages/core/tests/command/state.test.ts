import { describe, expect, it } from "vitest";

import {
  createCommandRegistry,
  createCommandSuccess,
  createDocument,
  createParagraph,
  createText,
  queryCommandState,
  type Command,
} from "../../src";

const context = {
  document: createDocument([createParagraph([createText("你好")])]),
};

function createNoopCommand(command: Partial<Command> = {}): Command {
  return {
    execute: () => createCommandSuccess("noop"),
    name: "noop",
    ...command,
  };
}

describe("queryCommandState", () => {
  it("returns a disabled state for missing commands", () => {
    const registry = createCommandRegistry();

    expect(queryCommandState(registry, "missing", { context })).toEqual({
      active: false,
      commandName: "missing",
      disabled: true,
      reason: "Command is not registered.",
      registered: false,
    });
  });

  it("returns a disabled state when canExecute returns false", () => {
    const registry = createCommandRegistry([
      createNoopCommand({ canExecute: () => false }),
    ]);

    expect(queryCommandState(registry, "noop", { context })).toEqual({
      active: false,
      commandName: "noop",
      disabled: true,
      reason: "Command cannot execute in the current context.",
      registered: true,
    });
  });
});

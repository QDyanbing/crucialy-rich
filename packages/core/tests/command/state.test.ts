import { describe, expect, it } from "vitest";

import {
  createCommandRegistry,
  createCommandSuccess,
  createDefaultCommandRegistry,
  createDocument,
  createParagraph,
  createText,
  DELETE_SELECTION_COMMAND_NAME,
  INSERT_TEXT_COMMAND_NAME,
  MERGE_BLOCK_COMMAND_NAME,
  queryCommandState,
  SPLIT_BLOCK_COMMAND_NAME,
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

  it("returns enabled and active command state", () => {
    const registry = createCommandRegistry([
      createNoopCommand({
        canExecute: () => true,
        isActive: () => true,
      }),
    ]);

    expect(queryCommandState(registry, "noop", { context })).toEqual({
      active: true,
      commandName: "noop",
      disabled: false,
      registered: true,
    });
  });

  it("reads default command states from selection shape", () => {
    const registry = createDefaultCommandRegistry();
    const document = createDocument([
      createParagraph([createText("你好")]),
      createParagraph([createText("第二段")]),
    ]);
    const rangeInput = {
      context: {
        document,
        selection: {
          anchor: { path: [0, 0], offset: 0 },
          focus: { path: [0, 0], offset: 1 },
        },
      },
      payload: { text: "新" },
    };
    const collapsedInput = {
      context: {
        document,
        selection: {
          anchor: { path: [0, 0], offset: 1 },
          focus: { path: [0, 0], offset: 1 },
        },
      },
      payload: { text: "新" },
    };
    const mergeInput = {
      context: {
        document,
        selection: {
          anchor: { path: [1, 0], offset: 0 },
          focus: { path: [1, 0], offset: 0 },
        },
      },
    };

    expect(
      queryCommandState(registry, INSERT_TEXT_COMMAND_NAME, rangeInput).disabled,
    ).toBe(false);
    expect(
      queryCommandState(registry, DELETE_SELECTION_COMMAND_NAME, rangeInput).disabled,
    ).toBe(false);
    expect(
      queryCommandState(registry, SPLIT_BLOCK_COMMAND_NAME, collapsedInput).disabled,
    ).toBe(false);
    expect(
      queryCommandState(registry, MERGE_BLOCK_COMMAND_NAME, mergeInput).disabled,
    ).toBe(false);
    expect(
      queryCommandState(registry, MERGE_BLOCK_COMMAND_NAME, collapsedInput).disabled,
    ).toBe(true);
  });
});

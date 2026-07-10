import { describe, expect, it } from "vitest";

import { createCommandRegistry, createCommandSuccess, type Command } from "../../src";

function createNoopCommand(name: string): Command {
  return {
    execute: () => createCommandSuccess(name),
    name,
  };
}

describe("createCommandRegistry", () => {
  it("creates a registry with initial commands", () => {
    const command = createNoopCommand("noop");
    const registry = createCommandRegistry([command]);

    expect(registry.has("noop")).toBe(true);
    expect(registry.get("noop")).toBe(command);
  });

  it("registers commands after creation", () => {
    const registry = createCommandRegistry();
    const command = createNoopCommand("noop");

    expect(registry.register(command)).toBe(registry);
    expect(registry.get("noop")).toBe(command);
  });

  it("overwrites commands with the same name", () => {
    const first = createNoopCommand("noop");
    const second = createNoopCommand("noop");
    const registry = createCommandRegistry([first]);

    registry.register(second);

    expect(registry.get("noop")).toBe(second);
    expect(registry.list()).toEqual([second]);
  });

  it("lists registered commands", () => {
    const first = createNoopCommand("first");
    const second = createNoopCommand("second");
    const registry = createCommandRegistry([first]).register(second);

    expect(registry.list()).toEqual([first, second]);
    expect(registry.has("missing")).toBe(false);
  });
});

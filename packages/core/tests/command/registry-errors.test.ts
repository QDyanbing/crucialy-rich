import { describe, expect, it, vi } from "vitest";
import {
  canExecuteCommand,
  createCommandRegistry,
  createDocument,
  executeCommand,
  queryCommandState,
  type CommandRegistry,
} from "../../src";

const input = { context: { document: createDocument() } };

describe("custom registry lookup errors", () => {
  it.each([new Error("Lookup failed."), "lookup", null, Symbol("lookup")])(
    "contains lookup failure consistently (%s)",
    (error) => {
      const has = vi.fn(() => true);
      const list = vi.fn(() => []);
      const registry = {
        ...createCommandRegistry(),
        has,
        list,
        get: () => {
          throw error;
        },
      };
      const reason =
        error instanceof Error ? error.message : "Command execution failed.";
      expect(canExecuteCommand(registry, "broken", input)).toBe(false);
      expect(executeCommand(registry, "broken", input)).toEqual({
        commandName: "broken",
        ok: false,
        status: "failure",
        reason,
      });
      expect(queryCommandState(registry, "broken", input)).toEqual({
        commandName: "broken",
        active: false,
        disabled: true,
        registered: false,
        reason,
      });
      expect(has).not.toHaveBeenCalled();
      expect(list).not.toHaveBeenCalled();
    },
  );

  it("contains an accessor failure while reading registry.get", () => {
    const registry = {
      ...createCommandRegistry(),
      get get(): CommandRegistry["get"] {
        throw new Error("Accessor failed.");
      },
    };
    expect(canExecuteCommand(registry, "broken", input)).toBe(false);
    expect(executeCommand(registry, "broken", input)).toMatchObject({
      status: "failure",
      reason: "Accessor failed.",
    });
    expect(queryCommandState(registry, "broken", input)).toMatchObject({
      disabled: true,
      registered: false,
      reason: "Accessor failed.",
    });
  });
});

import { describe, expect, it, vi } from "vitest";
import {
  createCommandRegistry,
  createCommandSuccess,
  createDocument,
  executeCommand,
  queryCommandState,
} from "../../src";

const input = { context: { document: createDocument() } };

describe("command state error isolation", () => {
  for (const stage of ["canExecute", "isActive"] as const) {
    it.each([new Error("State failed."), "state", null, Symbol("state")])(
      `disables only the command when ${stage} throws %s`,
      (error) => {
        const execute = vi.fn(() => createCommandSuccess("broken"));
        const registry = createCommandRegistry([
          {
            name: "broken",
            execute,
            [stage]: () => {
              throw error;
            },
          },
          {
            name: "healthy",
            execute: () => createCommandSuccess("healthy"),
            isActive: () => true,
          },
        ]);
        expect(queryCommandState(registry, "broken", input)).toEqual({
          commandName: "broken",
          active: false,
          disabled: true,
          registered: true,
          reason: error instanceof Error ? error.message : "Command execution failed.",
        });
        expect(queryCommandState(registry, "healthy", input)).toMatchObject({
          disabled: false,
          active: true,
        });
        expect(execute).not.toHaveBeenCalled();
      },
    );
  }

  it("preserves the active state of an ordinarily disabled command", () => {
    const registry = createCommandRegistry([
      {
        name: "disabled",
        execute: () => createCommandSuccess("disabled"),
        canExecute: () => false,
        isActive: () => true,
      },
    ]);
    expect(queryCommandState(registry, "disabled", input)).toMatchObject({
      disabled: true,
      active: true,
      registered: true,
    });
  });

  it("handles an Error whose message getter also throws", () => {
    const error = new Error();
    Object.defineProperty(error, "message", {
      get() {
        throw new Error("Message failed.");
      },
    });
    const registry = createCommandRegistry([
      {
        name: "broken",
        canExecute: () => {
          throw error;
        },
        execute: () => createCommandSuccess("broken"),
      },
    ]);
    expect(queryCommandState(registry, "broken", input).reason).toBe(
      "Command execution failed.",
    );
    expect(executeCommand(registry, "broken", input)).toMatchObject({
      status: "failure",
      reason: "Command execution failed.",
    });
  });
});

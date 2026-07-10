import { describe, expect, it } from "vitest";

import {
  createCommandFailure,
  createCommandSkipped,
  createCommandSuccess,
  createTransaction,
} from "../../src";

describe("command result helpers", () => {
  it("creates a success result", () => {
    const transaction = createTransaction();
    const result = createCommandSuccess("noop", { transaction });

    expect(result).toEqual({
      commandName: "noop",
      ok: true,
      status: "success",
      transaction,
    });
  });

  it("creates a failure result", () => {
    expect(createCommandFailure("noop", "No command.")).toEqual({
      commandName: "noop",
      ok: false,
      reason: "No command.",
      status: "failure",
    });
  });

  it("creates a skipped result", () => {
    expect(createCommandSkipped("noop", "Blocked.")).toEqual({
      commandName: "noop",
      ok: false,
      reason: "Blocked.",
      status: "skipped",
    });
  });
});

import type { CommandName, CommandResult } from "./types";

export function createCommandSuccess(
  commandName: CommandName,
  result: Omit<CommandResult, "commandName" | "ok" | "status"> = {},
): CommandResult {
  return {
    ...result,
    commandName,
    ok: true,
    status: "success",
  };
}

export function createCommandFailure(
  commandName: CommandName,
  reason: string,
): CommandResult {
  return {
    commandName,
    ok: false,
    reason,
    status: "failure",
  };
}

export function createCommandSkipped(
  commandName: CommandName,
  reason: string,
): CommandResult {
  return {
    commandName,
    ok: false,
    reason,
    status: "skipped",
  };
}

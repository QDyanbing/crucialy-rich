import { createCommandFailure, createCommandSkipped } from "./result";
import type { CommandRegistry } from "./registry";
import type { CommandInput, CommandName, CommandResult } from "./types";

function getErrorReason(error: unknown): string {
  return error instanceof Error ? error.message : "Command execution failed.";
}

export function executeCommand(
  registry: CommandRegistry,
  name: CommandName,
  input: CommandInput,
): CommandResult {
  const command = registry.get(name);

  if (!command) {
    return createCommandFailure(name, "Command is not registered.");
  }

  if (command.canExecute && !command.canExecute(input)) {
    return createCommandSkipped(name, "Command cannot execute in the current context.");
  }

  try {
    return command.execute(input);
  } catch (error) {
    return createCommandFailure(name, getErrorReason(error));
  }
}

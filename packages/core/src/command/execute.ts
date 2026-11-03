import { createCommandFailure, createCommandSkipped } from "./result";
import { getCommandErrorReason } from "./error";
import type { CommandRegistry } from "./registry";
import type { CommandInput, CommandName, CommandResult } from "./types";

export function executeCommand(
  registry: CommandRegistry,
  name: CommandName,
  input: CommandInput,
): CommandResult {
  try {
    const command = registry.get(name);
    if (!command) {
      return createCommandFailure(name, "Command is not registered.");
    }
    if (command.canExecute && !command.canExecute(input)) {
      return createCommandSkipped(
        name,
        "Command cannot execute in the current context.",
      );
    }
    return command.execute(input);
  } catch (error) {
    return createCommandFailure(name, getCommandErrorReason(error));
  }
}

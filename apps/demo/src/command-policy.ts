import {
  createCommandSkipped,
  executeCommand,
  type CommandInput,
  type CommandName,
  type CommandRegistry,
  type CommandResult,
} from "@crucialy-rich/core";

export function executeDemoCommand(
  registry: CommandRegistry,
  name: CommandName,
  input: CommandInput,
  locked: boolean,
): CommandResult {
  if (locked) return createCommandSkipped(name, "Demo editing context is locked.");
  return executeCommand(registry, name, input);
}

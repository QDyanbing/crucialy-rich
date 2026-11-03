import type { CommandRegistry } from "./registry";
import type { CommandInput, CommandName } from "./types";

export function canExecuteCommand(
  registry: CommandRegistry,
  name: CommandName,
  input: CommandInput,
): boolean {
  const command = registry.get(name);

  if (!command) {
    return false;
  }

  try {
    return command.canExecute ? command.canExecute(input) : true;
  } catch {
    return false;
  }
}

import type { CommandRegistry } from "./registry";
import type { CommandInput, CommandName } from "./types";

export function canExecuteCommand(
  registry: CommandRegistry,
  name: CommandName,
  input: CommandInput,
): boolean {
  try {
    const command = registry.get(name);
    if (!command) {
      return false;
    }
    return command.canExecute ? command.canExecute(input) : true;
  } catch {
    return false;
  }
}

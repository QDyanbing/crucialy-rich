import type { CommandRegistry } from "./registry";
import type { CommandInput, CommandName } from "./types";

export interface CommandState {
  active: boolean;
  commandName: CommandName;
  disabled: boolean;
  reason?: string;
  registered: boolean;
}

export function queryCommandState(
  registry: CommandRegistry,
  name: CommandName,
  input: CommandInput,
): CommandState {
  const command = registry.get(name);

  if (!command) {
    return {
      active: false,
      commandName: name,
      disabled: true,
      reason: "Command is not registered.",
      registered: false,
    };
  }

  const enabled = command.canExecute ? command.canExecute(input) : true;
  const active = command.isActive ? command.isActive(input) : false;

  if (enabled) {
    return {
      active,
      commandName: name,
      disabled: false,
      registered: true,
    };
  }

  return {
    active,
    commandName: name,
    disabled: true,
    reason: "Command cannot execute in the current context.",
    registered: true,
  };
}

import type { Command, CommandName } from "./types";

export interface CommandRegistry {
  get: (name: CommandName) => Command | undefined;
  has: (name: CommandName) => boolean;
  list: () => Command[];
  register: (command: Command) => CommandRegistry;
}

export function createCommandRegistry(commands: Command[] = []): CommandRegistry {
  const commandMap = new Map<CommandName, Command>();

  for (const command of commands) {
    commandMap.set(command.name, command);
  }

  const registry: CommandRegistry = {
    get(name) {
      return commandMap.get(name);
    },
    has(name) {
      return commandMap.has(name);
    },
    list() {
      return Array.from(commandMap.values());
    },
    register(command) {
      commandMap.set(command.name, command);

      return registry;
    },
  };

  return registry;
}

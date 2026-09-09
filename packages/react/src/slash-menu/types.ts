import type { CommandName } from "@crucialy-rich/core";

export interface SlashCommandItem {
  commandName: CommandName;
  description?: string;
  id: string;
  keywords?: readonly string[];
  label: string;
  payload?: unknown;
}

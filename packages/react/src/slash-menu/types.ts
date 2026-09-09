import type { CommandName, RangeSelection } from "@crucialy-rich/core";

export interface SlashCommandItem {
  commandName: CommandName;
  description?: string;
  id: string;
  keywords?: readonly string[];
  label: string;
  payload?: unknown;
}

export interface SlashMenuTrigger {
  query: string;
  range: RangeSelection;
  text: string;
}

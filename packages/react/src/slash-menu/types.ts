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

export interface SlashMenuAnchorRect {
  bottom: number;
  left: number;
  top: number;
}

export interface SlashMenuSize {
  height: number;
  width: number;
}

export interface SlashMenuViewport {
  height: number;
  width: number;
}

export interface SlashMenuPosition {
  left: number;
  placement: "above" | "below";
  top: number;
}

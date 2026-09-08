import type {
  CommandName,
  CommandResult,
  CommandState,
  RangeSelection,
} from "@crucialy-rich/core";

export interface ToolbarCommandItem {
  commandName: CommandName;
  id: string;
  label: string;
  payload?: unknown;
  text?: string;
  type: "command";
}

export interface ToolbarSeparatorItem {
  id: string;
  type: "separator";
}

export type ToolbarItem = ToolbarCommandItem | ToolbarSeparatorItem;

export interface ResolvedToolbarCommandItem extends ToolbarCommandItem {
  state: CommandState;
}

export type ResolvedToolbarItem = ResolvedToolbarCommandItem | ToolbarSeparatorItem;

export interface ToolbarCommandEvent {
  item: ToolbarCommandItem;
  result: CommandResult;
  selection?: RangeSelection;
}

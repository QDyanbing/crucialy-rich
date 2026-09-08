import {
  cloneRangeSelection,
  executeCommand,
  type CommandContext,
  type CommandRegistry,
} from "@crucialy-rich/core";

import type { ResolvedToolbarCommandItem, ToolbarCommandEvent } from "./types";

export function executeToolbarCommand(
  item: ResolvedToolbarCommandItem,
  registry: CommandRegistry,
  context: CommandContext,
): ToolbarCommandEvent {
  const result = executeCommand(registry, item.commandName, {
    context,
    payload: item.payload,
  });
  const selection = context.selection
    ? cloneRangeSelection(context.selection)
    : undefined;

  return {
    item,
    result,
    ...(selection ? { selection } : {}),
  };
}

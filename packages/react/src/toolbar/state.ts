import {
  queryCommandState,
  type CommandContext,
  type CommandRegistry,
} from "@crucialy-rich/core";

import type { ResolvedToolbarItem, ToolbarItem } from "./types";

export function resolveToolbarItems(
  items: readonly ToolbarItem[],
  registry: CommandRegistry,
  context: CommandContext,
): ResolvedToolbarItem[] {
  return items.map((item) => {
    if (item.type === "separator") {
      return { ...item };
    }

    return {
      ...item,
      state: queryCommandState(registry, item.commandName, {
        context,
        payload: item.payload,
      }),
    };
  });
}

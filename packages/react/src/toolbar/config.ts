import type { ToolbarItem } from "./types";

function assertToolbarItem(item: ToolbarItem, ids: Set<string>) {
  if (item.id.trim().length === 0) {
    throw new TypeError("Toolbar item id must not be empty.");
  }

  if (ids.has(item.id)) {
    throw new TypeError(`Toolbar item id must be unique: ${item.id}`);
  }

  if (
    item.type === "command" &&
    (item.commandName.trim().length === 0 || item.label.trim().length === 0)
  ) {
    throw new TypeError("Toolbar command name and label must not be empty.");
  }

  ids.add(item.id);
}

export function defineToolbarItems(items: readonly ToolbarItem[]): ToolbarItem[] {
  const ids = new Set<string>();

  items.forEach((item) => assertToolbarItem(item, ids));

  return items.map((item) => ({ ...item }));
}

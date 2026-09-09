import type { SlashCommandItem } from "./types";

function requireText(value: string, field: string): string {
  const normalized = value.trim();

  if (normalized.length === 0) {
    throw new TypeError(`Slash command ${field} must not be empty.`);
  }

  return normalized;
}

export function defineSlashCommandItems(
  items: readonly SlashCommandItem[],
): SlashCommandItem[] {
  const ids = new Set<string>();

  return items.map((item) => {
    const id = requireText(item.id, "id");

    if (ids.has(id)) {
      throw new TypeError(`Slash command id must be unique: ${id}`);
    }

    ids.add(id);

    const keywords = item.keywords?.map((keyword) => requireText(keyword, "keyword"));

    return {
      ...item,
      commandName: requireText(item.commandName, "name"),
      ...(item.description === undefined
        ? {}
        : { description: requireText(item.description, "description") }),
      id,
      ...(keywords === undefined ? {} : { keywords }),
      label: requireText(item.label, "label"),
    };
  });
}

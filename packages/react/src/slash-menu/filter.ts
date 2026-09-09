import type { SlashCommandItem } from "./types";

function normalizeSearchText(value: string): string {
  return value.trim().toLocaleLowerCase();
}

function getSearchTerms(item: SlashCommandItem): string[] {
  return [item.id, item.label, ...(item.keywords ?? [])].map(normalizeSearchText);
}

export function filterSlashCommandItems(
  items: readonly SlashCommandItem[],
  query: string,
): SlashCommandItem[] {
  const normalizedQuery = normalizeSearchText(query);

  if (normalizedQuery.length === 0) {
    return [...items];
  }

  return items.filter((item) =>
    getSearchTerms(item).some((term) => term.startsWith(normalizedQuery)),
  );
}

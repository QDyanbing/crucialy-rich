import type { ClipboardDataSource, ClipboardFragment, ClipboardParser } from "./types";
import { isOfficeHtml } from "./office";

export function parseClipboardData(
  source: ClipboardDataSource,
  parsers: readonly ClipboardParser[],
  acceptFragment?: (fragment: ClipboardFragment) => boolean,
): ClipboardFragment | undefined {
  if (!parsers.some((parser) => source.types.includes(parser.mimeType))) {
    return undefined;
  }

  const html = source.types.includes("text/html") ? source.getData("text/html") : "";
  const plainTextOnly = html.length > 0 && isOfficeHtml(html);

  for (const parser of parsers) {
    if (
      !source.types.includes(parser.mimeType) ||
      (plainTextOnly && parser.mimeType !== "text/plain")
    ) {
      continue;
    }

    const value =
      parser.mimeType === "text/html" ? html : source.getData(parser.mimeType);

    if (value.length === 0) {
      continue;
    }

    const fragment = parser.parse(value);

    if (fragment && (!acceptFragment || acceptFragment(fragment))) {
      return fragment;
    }
  }

  return undefined;
}

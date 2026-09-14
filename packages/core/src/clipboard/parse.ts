import type { ClipboardDataSource, ClipboardFragment, ClipboardParser } from "./types";

export function parseClipboardData(
  source: ClipboardDataSource,
  parsers: readonly ClipboardParser[],
): ClipboardFragment | undefined {
  for (const parser of parsers) {
    if (!source.types.includes(parser.mimeType)) {
      continue;
    }

    const value = source.getData(parser.mimeType);

    if (value.length === 0) {
      continue;
    }

    const fragment = parser.parse(value);

    if (fragment) {
      return fragment;
    }
  }

  return undefined;
}

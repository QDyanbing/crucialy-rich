import { marked } from "marked";

import { parseHtml } from "./html";
import type { ClipboardFragment, ClipboardParser } from "./types";

export function parseMarkdown(value: string): ClipboardFragment | undefined {
  if (value.trim().length === 0) {
    return undefined;
  }

  const html = marked.parse(value, { async: false, gfm: true });
  const fragment = parseHtml(html);

  return fragment ? { blocks: fragment.blocks, mimeType: "text/markdown" } : undefined;
}

export const markdownClipboardParser: ClipboardParser = {
  mimeType: "text/markdown",
  parse: parseMarkdown,
};

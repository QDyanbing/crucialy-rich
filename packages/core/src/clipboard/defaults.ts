import { htmlClipboardParser } from "./html";
import { markdownClipboardParser } from "./markdown";
import { plainTextClipboardParser } from "./plain-text";
import type { ClipboardParser } from "./types";

export const DEFAULT_CLIPBOARD_PARSERS: readonly ClipboardParser[] = [
  markdownClipboardParser,
  htmlClipboardParser,
  plainTextClipboardParser,
];

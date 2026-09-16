export { parseClipboardData } from "./parse";
export { htmlClipboardParser, parseHtml } from "./html";
export { markdownClipboardParser, parseMarkdown } from "./markdown";
export { parsePlainText, plainTextClipboardParser } from "./plain-text";
export { getPlainTextTableGrid } from "./tsv";
export type { TableClipboardGrid } from "./tsv";
export {
  CLIPBOARD_ALLOWED_ATTRIBUTES,
  CLIPBOARD_ALLOWED_TAGS,
  CLIPBOARD_MIME_TYPES,
} from "./types";
export type {
  ClipboardDataSource,
  ClipboardFragment,
  ClipboardMimeType,
  ClipboardParser,
} from "./types";
export { DEFAULT_CLIPBOARD_PARSERS } from "./defaults";

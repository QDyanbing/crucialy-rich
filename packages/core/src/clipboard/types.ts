import type { BlockNode } from "../model";

export const CLIPBOARD_MIME_TYPES = [
  "text/markdown",
  "text/html",
  "text/plain",
] as const;

export type ClipboardMimeType = (typeof CLIPBOARD_MIME_TYPES)[number];

export const CLIPBOARD_ALLOWED_TAGS = [
  "a",
  "blockquote",
  "br",
  "code",
  "em",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "li",
  "ol",
  "p",
  "pre",
  "strong",
  "ul",
] as const;

export const CLIPBOARD_ALLOWED_ATTRIBUTES = {
  a: ["href"],
} as const;

export interface ClipboardDataSource {
  getData: (mimeType: string) => string;
  types: readonly string[];
}

export interface ClipboardFragment {
  blocks: BlockNode[];
  mimeType: ClipboardMimeType;
}

export interface ClipboardParser {
  mimeType: ClipboardMimeType;
  parse: (value: string) => ClipboardFragment | undefined;
}

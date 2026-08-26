import {
  HEADING_LEVELS,
  type BlockNode,
  type DocumentNode,
  type HeadingLevel,
  type HeadingNode,
  type ParagraphNode,
  type QuoteNode,
  type TextNode,
} from "./types";

const HEADING_LEVEL_SET = new Set<number>(HEADING_LEVELS);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isTextNode(value: unknown): value is TextNode {
  return isRecord(value) && value.type === "text" && typeof value.text === "string";
}

export function isParagraphNode(value: unknown): value is ParagraphNode {
  return isRecord(value) && value.type === "paragraph" && Array.isArray(value.children);
}

export function isHeadingLevel(value: unknown): value is HeadingLevel {
  return typeof value === "number" && HEADING_LEVEL_SET.has(value);
}

export function isHeadingNode(value: unknown): value is HeadingNode {
  return (
    isRecord(value) &&
    value.type === "heading" &&
    isHeadingLevel(value.level) &&
    Array.isArray(value.children)
  );
}

export function isQuoteNode(value: unknown): value is QuoteNode {
  return isRecord(value) && value.type === "quote" && Array.isArray(value.children);
}

/**
 * 块级节点判断。当前等价于 paragraph，后续随 schema 扩展。
 */
export function isBlockNode(value: unknown): value is BlockNode {
  return isParagraphNode(value);
}

export function isDocumentNode(value: unknown): value is DocumentNode {
  return isRecord(value) && value.type === "document" && Array.isArray(value.children);
}

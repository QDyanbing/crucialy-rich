import type { BlockNode, DocumentNode, ParagraphNode, TextNode } from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isTextNode(value: unknown): value is TextNode {
  return isRecord(value) && value.type === "text" && typeof value.text === "string";
}

export function isParagraphNode(value: unknown): value is ParagraphNode {
  return isRecord(value) && value.type === "paragraph" && Array.isArray(value.children);
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

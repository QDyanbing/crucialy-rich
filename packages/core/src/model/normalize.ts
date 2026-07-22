import { createDocument, createParagraph, createText } from "./factories";
import { isBlockNode, isDocumentNode, isTextNode } from "./guards";
import { normalizeTextMarks } from "./marks";
import type { DocumentNode, ParagraphNode, TextNode } from "./types";

/**
 * 把任意输入修复为合法文档。
 *
 * 当前修复策略：
 * - 非 document 根节点直接替换为空文档。
 * - 空 document 自动补一个空段落。
 * - 段落里的非法 children 被丢弃。
 * - text marks 会被规范化为受支持的 true 值。
 * - 空 paragraph 自动补一个空 text。
 */
export function normalizeDocument(value: unknown): DocumentNode {
  if (!isDocumentNode(value)) {
    return createDocument();
  }

  const children = value.children.filter(isBlockNode).map(normalizeParagraph);

  return {
    type: "document",
    children: children.length > 0 ? children : [createParagraph()],
  };
}

function normalizeParagraph(node: ParagraphNode): ParagraphNode {
  const children = node.children.filter(isTextNode).map(normalizeTextNode);

  return {
    type: "paragraph",
    children: children.length > 0 ? children : [createText()],
  };
}

function normalizeTextNode(node: TextNode): TextNode {
  return createText(node.text, normalizeTextMarks(node.marks));
}

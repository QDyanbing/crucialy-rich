import {
  createDocument,
  createListItem,
  createParagraph,
  createText,
} from "./factories";
import {
  isBlockNode,
  isDocumentNode,
  isListItemNode,
  isListNode,
  isTextBlockNode,
  isTextNode,
} from "./guards";
import { mergeAdjacentTextNodes, normalizeTextMarks } from "./marks";
import type {
  BlockNode,
  DocumentNode,
  ListItemNode,
  ListNode,
  TextNode,
} from "./types";

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

  const children = value.children.filter(isBlockNode).map(normalizeBlock);

  return {
    type: "document",
    children: children.length > 0 ? children : [createParagraph()],
  };
}

function normalizeBlock(node: BlockNode): BlockNode {
  if (isListNode(node)) {
    return normalizeList(node);
  }

  if (!isTextBlockNode(node)) {
    return { children: [], type: "divider" };
  }

  const children = mergeAdjacentTextNodes(
    node.children
      .filter(isTextNode)
      .map(node.type === "codeBlock" ? normalizeCodeTextNode : normalizeTextNode),
  );
  const normalizedChildren = children.length > 0 ? children : [createText()];

  switch (node.type) {
    case "codeBlock":
      return { children: normalizedChildren, type: "codeBlock" };
    case "heading":
      return { children: normalizedChildren, level: node.level, type: "heading" };
    case "paragraph":
      return { children: normalizedChildren, type: "paragraph" };
    case "quote":
      return { children: normalizedChildren, type: "quote" };
  }
}

function normalizeList(node: ListNode): ListNode {
  const children = node.children.filter(isListItemNode).map(normalizeListItem);

  return {
    children: children.length > 0 ? children : [createListItem()],
    type: node.type,
  };
}

function normalizeListItem(node: ListItemNode): ListItemNode {
  const children = mergeAdjacentTextNodes(
    node.children.filter(isTextNode).map(normalizeTextNode),
  );

  return createListItem(children.length > 0 ? children : [createText()]);
}

function normalizeCodeTextNode(node: TextNode): TextNode {
  return createText(node.text);
}

function normalizeTextNode(node: TextNode): TextNode {
  return createText(node.text, normalizeTextMarks(node.marks));
}

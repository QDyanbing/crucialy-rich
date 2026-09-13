import {
  createDocument,
  createListItem,
  createParagraph,
  createText,
  createTaskItem,
} from "./factories";
import {
  isBlockNode,
  isDocumentNode,
  isImageNode,
  isImageStatus,
  isListItemNode,
  isListNode,
  isTextBlockNode,
  isTextNode,
  isTaskItemNode,
} from "./guards";
import { normalizeImageDimension, sanitizeImageSrc } from "./image";
import { mergeAdjacentTextNodes, normalizeTextMarks } from "./marks";
import { MAX_LIST_DEPTH } from "./types";
import type {
  BlockNode,
  DocumentNode,
  ListEntryNode,
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

  const children = value.children.filter(isBlockNode).flatMap((child) => {
    const normalized = normalizeBlock(child);

    return normalized ? [normalized] : [];
  });

  return {
    type: "document",
    children: children.length > 0 ? children : [createParagraph()],
  };
}

function normalizeBlock(node: BlockNode): BlockNode | undefined {
  if (isListNode(node)) {
    return normalizeList(node, 1);
  }

  if (isImageNode(node)) {
    const src = sanitizeImageSrc(node.src);

    return src
      ? {
          alt: typeof node.alt === "string" ? node.alt : "",
          children: [],
          height: normalizeImageDimension(node.height),
          src,
          status: isImageStatus(node.status) ? node.status : "error",
          type: "image",
          width: normalizeImageDimension(node.width),
        }
      : undefined;
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

function normalizeList(node: ListNode, depth: number): ListNode {
  const isExpectedItem = node.type === "taskList" ? isTaskItemNode : isListItemNode;
  const children = node.children
    .filter(isExpectedItem)
    .map((item) => normalizeListItem(item, depth));
  const fallback = node.type === "taskList" ? createTaskItem() : createListItem();

  return {
    children: children.length > 0 ? children : [fallback],
    type: node.type,
  };
}

function normalizeListItem(node: ListEntryNode, depth: number): ListEntryNode {
  const children = mergeAdjacentTextNodes(
    node.children.filter(isTextNode).map(normalizeTextNode),
  );
  const nested =
    depth < MAX_LIST_DEPTH && isListNode(node.nested)
      ? normalizeList(node.nested, depth + 1)
      : undefined;

  const normalizedChildren = children.length > 0 ? children : [createText()];

  return node.type === "taskItem"
    ? createTaskItem(normalizedChildren, node.checked, nested)
    : createListItem(normalizedChildren, nested);
}

function normalizeCodeTextNode(node: TextNode): TextNode {
  return createText(node.text);
}

function normalizeTextNode(node: TextNode): TextNode {
  return createText(node.text, normalizeTextMarks(node.marks));
}

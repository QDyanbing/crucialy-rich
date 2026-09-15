import {
  createDocument,
  createListItem,
  createParagraph,
  createText,
  createTaskItem,
  createTable,
  createTableCell,
  createTableRow,
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
  isParagraphNode,
  isTableCellNode,
  isTableNode,
  isTableRowNode,
} from "./guards";
import { normalizeImageDimension, sanitizeImageSrc } from "./image";
import { mergeAdjacentTextNodes, normalizeTextMarks } from "./marks";
import { MAX_LIST_DEPTH } from "./types";
import type {
  BlockNode,
  DocumentNode,
  ListEntryNode,
  ListNode,
  ParagraphNode,
  TableCellNode,
  TableNode,
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

  if (isTableNode(node)) {
    return normalizeTable(node);
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

function normalizeTable(node: TableNode): TableNode {
  const rows = node.children.filter(isTableRowNode);

  if (rows.length === 0) {
    return createTable(1, 1);
  }

  const columnCount = Math.max(
    1,
    ...rows.map((row) => row.children.filter(isTableCellNode).length),
  );

  return {
    children: rows.map((row) => {
      const cells = row.children
        .filter(isTableCellNode)
        .map((cell) => normalizeTableCell(cell));

      return createTableRow([
        ...cells,
        ...Array.from({ length: columnCount - cells.length }, () => createTableCell()),
      ]);
    }),
    type: "table",
  };
}

function normalizeTableCell(node: TableCellNode): TableCellNode {
  const paragraphs = node.children.filter(isParagraphNode).map(normalizeTableParagraph);

  return createTableCell(paragraphs.length > 0 ? paragraphs : undefined);
}

function normalizeTableParagraph(node: ParagraphNode): ParagraphNode {
  const children = mergeAdjacentTextNodes(
    node.children.filter(isTextNode).map(normalizeTextNode),
  );

  return createParagraph(children.length > 0 ? children : undefined);
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

import { normalizeTextMarks } from "./marks";
import type {
  BlockNode,
  BulletListNode,
  CodeBlockNode,
  DividerNode,
  DocumentNode,
  HeadingLevel,
  HeadingNode,
  ImageNode,
  ImageStatus,
  ListItemNode,
  ListNode,
  OrderedListNode,
  ParagraphNode,
  QuoteNode,
  TextMarks,
  TextNode,
  TaskItemNode,
  TaskListNode,
  TableCellNode,
  TableNode,
  TableRowNode,
} from "./types";

/**
 * 创建一个 text 节点，默认空字符串。
 */
export function createText(text = "", marks?: TextMarks): TextNode {
  const normalizedMarks = normalizeTextMarks(marks);

  return normalizedMarks === undefined
    ? { type: "text", text }
    : { type: "text", text, marks: normalizedMarks };
}

/**
 * 创建一个 paragraph 节点。
 *
 * 不传 children 时返回包含一个空 text 的合法段落。
 * 传入的 children 原样保留，是否合法由 validate / normalize 负责。
 */
export function createParagraph(children: TextNode[] = [createText()]): ParagraphNode {
  return { type: "paragraph", children };
}

/**
 * 创建一个 heading 节点，默认使用一级标题。
 */
export function createHeading(
  level: HeadingLevel = 1,
  children: TextNode[] = [createText()],
): HeadingNode {
  return { type: "heading", children, level };
}

/**
 * 创建一个 quote 节点。
 */
export function createQuote(children: TextNode[] = [createText()]): QuoteNode {
  return { type: "quote", children };
}

/**
 * 创建一个只包含纯文本的 codeBlock 节点。
 */
export function createCodeBlock(children: TextNode[] = [createText()]): CodeBlockNode {
  return {
    type: "codeBlock",
    children: children.map((child) => createText(child.text)),
  };
}

/** 创建一个不可编辑的分隔线节点。 */
export function createDivider(): DividerNode {
  return { children: [], type: "divider" };
}

export interface CreateImageOptions {
  alt?: string;
  height?: number | null;
  status?: ImageStatus;
  width?: number | null;
}

/** 创建一个不可编辑的图片节点。 */
export function createImage(src: string, options: CreateImageOptions = {}): ImageNode {
  return {
    alt: options.alt ?? "",
    children: [],
    height: options.height ?? null,
    src,
    status: options.status ?? "ready",
    type: "image",
    width: options.width ?? null,
  };
}

export function createListItem(
  children: TextNode[] = [createText()],
  nested?: ListNode,
): ListItemNode {
  return nested
    ? { children, nested, type: "listItem" }
    : { children, type: "listItem" };
}

export function createBulletList(
  children: ListItemNode[] = [createListItem()],
): BulletListNode {
  return { children, type: "bulletList" };
}

export function createOrderedList(
  children: ListItemNode[] = [createListItem()],
): OrderedListNode {
  return { children, type: "orderedList" };
}

export function createTaskItem(
  children: TextNode[] = [createText()],
  checked = false,
  nested?: ListNode,
): TaskItemNode {
  return nested
    ? { checked, children, nested, type: "taskItem" }
    : { checked, children, type: "taskItem" };
}

export function createTaskList(
  children: TaskItemNode[] = [createTaskItem()],
): TaskListNode {
  return { children, type: "taskList" };
}

/** 创建一个只允许包含段落的表格单元格。 */
export function createTableCell(
  children: ParagraphNode[] = [createParagraph()],
): TableCellNode {
  return { children, type: "tableCell" };
}

/** 创建一个表格行，默认包含一个空单元格。 */
export function createTableRow(
  children: TableCellNode[] = [createTableCell()],
): TableRowNode {
  return { children, type: "tableRow" };
}

/** 创建一个规则表格，默认尺寸为 3 行 3 列。 */
export function createTable(rows = 3, columns = 3): TableNode {
  const rowCount = Math.max(1, Math.trunc(rows));
  const columnCount = Math.max(1, Math.trunc(columns));

  return {
    children: Array.from({ length: rowCount }, () =>
      createTableRow(Array.from({ length: columnCount }, () => createTableCell())),
    ),
    type: "table",
  };
}

/**
 * 创建一个 document 节点。
 *
 * 不传 children 时返回包含一个空段落的合法文档。
 */
export function createDocument(
  children: BlockNode[] = [createParagraph()],
): DocumentNode {
  return { type: "document", children };
}

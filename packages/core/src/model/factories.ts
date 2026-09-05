import { normalizeTextMarks } from "./marks";
import type {
  BlockNode,
  BulletListNode,
  CodeBlockNode,
  DividerNode,
  DocumentNode,
  HeadingLevel,
  HeadingNode,
  ListItemNode,
  OrderedListNode,
  ParagraphNode,
  QuoteNode,
  TextMarks,
  TextNode,
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

export function createListItem(children: TextNode[] = [createText()]): ListItemNode {
  return { children, type: "listItem" };
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

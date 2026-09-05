/**
 * 文档模型的第一版类型定义。
 *
 * 当前阶段支持 `document` -> `block` -> `text` 三层结构，
 * text 节点可携带 boolean marks 和文字样式属性 marks。
 */

export const BLOCK_TYPES = [
  "paragraph",
  "heading",
  "quote",
  "codeBlock",
  "divider",
] as const;

export const VOID_BLOCK_TYPES = ["divider"] as const;

export const LIST_TYPES = ["bulletList", "orderedList"] as const;

export const HEADING_LEVELS = [1, 2, 3, 4, 5, 6] as const;

export const TEXT_MARK_TYPES = ["bold", "italic", "underline", "strike"] as const;

export const TEXT_MARK_ATTRIBUTE_TYPES = [
  "fontSize",
  "textColor",
  "backgroundColor",
] as const;

export const LINK_TARGETS = ["_self", "_blank"] as const;

export const LINK_REL_TOKENS = ["nofollow", "noopener", "noreferrer"] as const;

export type TextMarkType = (typeof TEXT_MARK_TYPES)[number];

export type BlockType = (typeof BLOCK_TYPES)[number];

export type ListType = (typeof LIST_TYPES)[number];

export type HeadingLevel = (typeof HEADING_LEVELS)[number];

export type TextMarkAttributeType = (typeof TEXT_MARK_ATTRIBUTE_TYPES)[number];

export type LinkTarget = (typeof LINK_TARGETS)[number];

export type LinkRelToken = (typeof LINK_REL_TOKENS)[number];

export interface LinkMarkAttributes {
  href: string;
  rel?: string;
  target?: LinkTarget;
}

export interface TextMarkAttributes {
  fontSize: number;
  textColor: string;
  backgroundColor: string;
}

export type TextMarks = Partial<Record<TextMarkType, true>> &
  Partial<TextMarkAttributes> & {
    link?: LinkMarkAttributes;
  };

export interface TextNode {
  type: "text";
  text: string;
  marks?: TextMarks;
}

export interface ParagraphNode {
  type: "paragraph";
  children: TextNode[];
}

export interface HeadingNode {
  type: "heading";
  children: TextNode[];
  level: HeadingLevel;
}

export interface QuoteNode {
  type: "quote";
  children: TextNode[];
}

export interface CodeBlockNode {
  type: "codeBlock";
  children: TextNode[];
}

export interface DividerNode {
  type: "divider";
  children: [];
}

export interface ListItemNode {
  type: "listItem";
  children: TextNode[];
}

export interface BulletListNode {
  type: "bulletList";
  children: ListItemNode[];
}

export interface OrderedListNode {
  type: "orderedList";
  children: ListItemNode[];
}

export type ListNode = BulletListNode | OrderedListNode;

/**
 * 文本块直接包含 text children，空块不包含可编辑文本。
 */
export type TextBlockNode = CodeBlockNode | HeadingNode | ParagraphNode | QuoteNode;

export type VoidBlockNode = DividerNode;

export type BlockNode = TextBlockNode | VoidBlockNode;

export interface DocumentNode {
  type: "document";
  children: BlockNode[];
}

/**
 * 文档树中可能出现的所有节点类型。
 */
export type Node = DocumentNode | BlockNode | TextNode;

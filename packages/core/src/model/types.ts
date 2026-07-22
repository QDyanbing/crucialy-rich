/**
 * 文档模型的第一版类型定义。
 *
 * 当前阶段支持 `document` -> `paragraph` -> `text` 三层结构，
 * text 节点可携带 bold / italic marks。
 */

export const TEXT_MARK_TYPES = ["bold", "italic"] as const;

export type TextMarkType = (typeof TEXT_MARK_TYPES)[number];

export type TextMarks = Partial<Record<TextMarkType, true>>;

export interface TextNode {
  type: "text";
  text: string;
  marks?: TextMarks;
}

export interface ParagraphNode {
  type: "paragraph";
  children: TextNode[];
}

/**
 * 块级节点联合类型。当前只有 paragraph，后续会加入 heading、quote 等。
 */
export type BlockNode = ParagraphNode;

export interface DocumentNode {
  type: "document";
  children: BlockNode[];
}

/**
 * 文档树中可能出现的所有节点类型。
 */
export type Node = DocumentNode | BlockNode | TextNode;

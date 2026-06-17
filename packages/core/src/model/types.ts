/**
 * 文档模型的第一版类型定义。
 *
 * 当前阶段只支持 `document` -> `paragraph` -> `text` 三层结构，
 * 后续功能（marks、heading、list 等）会在此基础上扩展。
 */

export interface TextNode {
  type: "text";
  text: string;
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

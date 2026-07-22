import type { DocumentNode, ParagraphNode, TextMarks, TextNode } from "./types";

/**
 * 创建一个 text 节点，默认空字符串。
 */
export function createText(text = "", marks?: TextMarks): TextNode {
  const normalizedMarks =
    marks === undefined || Object.keys(marks).length === 0 ? undefined : { ...marks };

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
 * 创建一个 document 节点。
 *
 * 不传 children 时返回包含一个空段落的合法文档。
 */
export function createDocument(
  children: ParagraphNode[] = [createParagraph()],
): DocumentNode {
  return { type: "document", children };
}

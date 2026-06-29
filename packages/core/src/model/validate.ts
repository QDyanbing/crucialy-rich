import { isBlockNode, isDocumentNode, isTextNode } from "./guards";

export interface ValidationError {
  /** 出错节点的路径，root 为空数组。 */
  path: number[];
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * 校验一个值是否为合法文档。
 *
 * 当前规则：
 * - 根节点必须是 document。
 * - document 的 children 只能是块级节点。
 * - paragraph 的 children 只能是 text 节点。
 */
export function validateDocument(value: unknown): ValidationResult {
  const errors: ValidationError[] = [];

  if (!isDocumentNode(value)) {
    errors.push({ path: [], message: "根节点必须是 document 节点" });
    return { valid: false, errors };
  }

  value.children.forEach((child, blockIndex) => {
    if (!isBlockNode(child)) {
      errors.push({
        path: [blockIndex],
        message: "document 子节点必须是块级节点",
      });
      return;
    }

    child.children.forEach((leaf, leafIndex) => {
      if (!isTextNode(leaf)) {
        errors.push({
          path: [blockIndex, leafIndex],
          message: "paragraph 子节点必须是 text 节点",
        });
      }
    });
  });

  return { valid: errors.length === 0, errors };
}

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
    errors.push({ path: [], message: "root must be a document node" });
    return { valid: false, errors };
  }

  value.children.forEach((child, blockIndex) => {
    if (!isBlockNode(child)) {
      errors.push({
        path: [blockIndex],
        message: "document child must be a block node",
      });
      return;
    }

    child.children.forEach((leaf, leafIndex) => {
      if (!isTextNode(leaf)) {
        errors.push({
          path: [blockIndex, leafIndex],
          message: "paragraph child must be a text node",
        });
      }
    });
  });

  return { valid: errors.length === 0, errors };
}

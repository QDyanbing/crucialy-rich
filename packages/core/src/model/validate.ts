import { isBlockNode, isDocumentNode, isTextNode } from "./guards";
import { isValidLinkMark } from "./link";
import { isValidTextMarkAttributeValue } from "./marks";
import {
  TEXT_MARK_ATTRIBUTE_TYPES,
  TEXT_MARK_TYPES,
  type TextMarkAttributeType,
} from "./types";

export interface ValidationError {
  /** 出错节点的路径，root 为空数组。 */
  path: number[];
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

const TEXT_MARK_TYPE_SET = new Set<string>(TEXT_MARK_TYPES);
const TEXT_MARK_ATTRIBUTE_TYPE_SET = new Set<string>(TEXT_MARK_ATTRIBUTE_TYPES);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateTextMarks(
  value: { marks?: unknown },
  path: number[],
  errors: ValidationError[],
): void {
  if (value.marks === undefined) {
    return;
  }

  if (!isRecord(value.marks)) {
    errors.push({
      path,
      message: "text marks 必须是对象",
    });
    return;
  }

  Object.entries(value.marks).forEach(([mark, enabled]) => {
    if (TEXT_MARK_TYPE_SET.has(mark)) {
      if (enabled !== true) {
        errors.push({
          path,
          message: `text mark ${mark} 的值必须是 true`,
        });
      }
      return;
    }

    if (mark === "link") {
      if (!isValidLinkMark(enabled)) {
        errors.push({
          path,
          message:
            "text mark link 必须包含安全 href，且 target 和 rel 必须使用受支持的值",
        });
      }
      return;
    }

    if (TEXT_MARK_ATTRIBUTE_TYPE_SET.has(mark)) {
      const attribute = mark as TextMarkAttributeType;

      if (!isValidTextMarkAttributeValue(attribute, enabled)) {
        errors.push({
          path,
          message:
            attribute === "fontSize"
              ? "text mark fontSize 的值必须是 8 到 72 之间的整数"
              : `text mark ${attribute} 的值必须是 #RGB 或 #RRGGBB 十六进制颜色`,
        });
      }
      return;
    }

    errors.push({
      path,
      message: `text mark ${mark} 不受支持`,
    });
  });
}

/**
 * 校验一个值是否为合法文档。
 *
 * 当前规则：
 * - 根节点必须是 document。
 * - document 的 children 只能是块级节点。
 * - 块级节点的 children 只能是 text 节点。
 * - text 节点的 marks 只能包含受支持的 boolean、文字属性或 Link Mark。
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
          message: "块级节点子节点必须是 text 节点",
        });
        return;
      }

      if (child.type === "codeBlock" && leaf.marks !== undefined) {
        errors.push({
          path: [blockIndex, leafIndex],
          message: "codeBlock text 不支持 marks",
        });
        return;
      }

      validateTextMarks(leaf, [blockIndex, leafIndex], errors);
    });
  });

  return { valid: errors.length === 0, errors };
}

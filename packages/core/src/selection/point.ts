import { isTextNode, type DocumentNode } from "../model";
import { getNodeAtPath } from "./path";
import type { Point } from "./types";

function isOffset(value: number): boolean {
  return Number.isInteger(value) && value >= 0;
}

/**
 * 校验 point 是否指向一个 text 节点内的合法 offset。
 */
export function isValidPoint(document: DocumentNode, point: Point): boolean {
  if (!isOffset(point.offset)) {
    return false;
  }

  const node = getNodeAtPath(document, point.path);

  return isTextNode(node) && point.offset <= node.text.length;
}

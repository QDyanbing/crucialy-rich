import { isTextNode, type DocumentNode } from "../model";
import { getNodeAtPath } from "./path";
import type { Path, Point } from "./types";

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

function comparePath(left: Path, right: Path): -1 | 0 | 1 {
  const length = Math.max(left.length, right.length);

  for (let index = 0; index < length; index += 1) {
    const leftPart = left[index];
    const rightPart = right[index];

    if (leftPart === undefined && rightPart === undefined) {
      return 0;
    }

    if (leftPart === undefined) {
      return -1;
    }

    if (rightPart === undefined) {
      return 1;
    }

    if (leftPart < rightPart) {
      return -1;
    }

    if (leftPart > rightPart) {
      return 1;
    }
  }

  return 0;
}

export function comparePoint(left: Point, right: Point): -1 | 0 | 1 {
  const pathResult = comparePath(left.path, right.path);

  if (pathResult !== 0) {
    return pathResult;
  }

  if (left.offset < right.offset) {
    return -1;
  }

  if (left.offset > right.offset) {
    return 1;
  }

  return 0;
}

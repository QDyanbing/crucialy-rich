import type { DocumentNode, Node } from "../model";
import type { Path } from "./types";

function isPathIndex(value: number): boolean {
  return Number.isInteger(value) && value >= 0;
}

/**
 * 根据 path 读取文档树节点。
 *
 * 当前只支持 document / paragraph / text 三层，非法路径返回 undefined。
 */
export function getNodeAtPath(document: DocumentNode, path: Path): Node | undefined {
  if (path.length === 0) {
    return document;
  }

  if (!path.every(isPathIndex)) {
    return undefined;
  }

  const [blockIndex, textIndex, ...rest] = path;

  if (rest.length > 0 || blockIndex === undefined) {
    return undefined;
  }

  const block = document.children[blockIndex];

  if (!block || textIndex === undefined) {
    return block;
  }

  return block.children[textIndex];
}

export function hasNodeAtPath(document: DocumentNode, path: Path): boolean {
  return getNodeAtPath(document, path) !== undefined;
}

import {
  isListItemNode,
  isListNode,
  isTextBlockNode,
  type DocumentNode,
  type Node,
} from "../model";
import type { Path } from "./types";

function isPathIndex(value: number): boolean {
  return Number.isInteger(value) && value >= 0;
}

/**
 * 根据 path 读取文档树节点。
 *
 * 支持 document / block / listItem / text，非法路径返回 undefined。
 */
export function getNodeAtPath(document: DocumentNode, path: Path): Node | undefined {
  if (path.length === 0) {
    return document;
  }

  if (!path.every(isPathIndex)) {
    return undefined;
  }

  const [blockIndex, childIndex, textIndex, ...rest] = path;

  if (rest.length > 0 || blockIndex === undefined) {
    return undefined;
  }

  const block = document.children[blockIndex];

  if (!block || childIndex === undefined) {
    return block;
  }

  if (isTextBlockNode(block)) {
    return textIndex === undefined ? block.children[childIndex] : undefined;
  }

  if (!isListNode(block)) {
    return undefined;
  }

  const item = block.children[childIndex];

  if (!item || textIndex === undefined) {
    return item;
  }

  return isListItemNode(item) ? item.children[textIndex] : undefined;
}

export function hasNodeAtPath(document: DocumentNode, path: Path): boolean {
  return getNodeAtPath(document, path) !== undefined;
}

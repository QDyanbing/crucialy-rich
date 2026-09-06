import {
  isListNode,
  isTextBlockNode,
  type DocumentNode,
  type ListNode,
  type Node,
} from "../model";
import type { Path } from "./types";

function isPathIndex(value: number): boolean {
  return Number.isInteger(value) && value >= 0;
}

function getNodeInList(list: ListNode, path: Path): Node | undefined {
  const [itemIndex, childIndex, ...rest] = path;

  if (itemIndex === undefined) {
    return list;
  }

  const item = list.children[itemIndex];

  if (!item || childIndex === undefined) {
    return item;
  }

  if (childIndex < item.children.length) {
    return rest.length === 0 ? item.children[childIndex] : undefined;
  }

  if (childIndex !== item.children.length || !item.nested) {
    return undefined;
  }

  return rest.length === 0 ? item.nested : getNodeInList(item.nested, rest);
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

  const [blockIndex, ...rest] = path;

  if (blockIndex === undefined) {
    return undefined;
  }

  const block = document.children[blockIndex];

  if (!block || rest.length === 0) {
    return block;
  }

  if (isTextBlockNode(block)) {
    return rest.length === 1 ? block.children[rest[0]!] : undefined;
  }

  if (!isListNode(block)) {
    return undefined;
  }

  return getNodeInList(block, rest);
}

export function hasNodeAtPath(document: DocumentNode, path: Path): boolean {
  return getNodeAtPath(document, path) !== undefined;
}

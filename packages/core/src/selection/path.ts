import {
  isListNode,
  isTableNode,
  isTextBlockNode,
  type DocumentNode,
  type ListNode,
  type Node,
  type TableNode,
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

function getNodeInTable(table: TableNode, path: Path): Node | undefined {
  const [rowIndex, cellIndex, paragraphIndex, textIndex, ...rest] = path;
  const row = rowIndex === undefined ? undefined : table.children[rowIndex];

  if (rowIndex === undefined) {
    return table;
  }
  if (!row || cellIndex === undefined) {
    return row;
  }

  const cell = row.children[cellIndex];
  if (!cell || paragraphIndex === undefined) {
    return cell;
  }

  const paragraph = cell.children[paragraphIndex];
  if (!paragraph || textIndex === undefined) {
    return paragraph;
  }

  const text = paragraph.children[textIndex];
  return rest.length === 0 ? text : undefined;
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

  if (isTableNode(block)) {
    return getNodeInTable(block, rest);
  }

  if (!isListNode(block)) {
    return undefined;
  }

  return getNodeInList(block, rest);
}

export function hasNodeAtPath(document: DocumentNode, path: Path): boolean {
  return getNodeAtPath(document, path) !== undefined;
}

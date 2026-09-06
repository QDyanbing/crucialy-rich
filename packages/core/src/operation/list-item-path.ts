import {
  isListNode,
  type DocumentNode,
  type ListItemNode,
  type ListNode,
} from "../model";
import { isValidPoint, type Path, type Point } from "../selection";

export interface ListItemTarget {
  blockIndex: number;
  item: ListItemNode;
  itemIndex: number;
  list: ListNode;
  listPath: Path;
  textIndex: number;
}

export function getListItemTarget(
  document: DocumentNode,
  point: Point,
): ListItemTarget | undefined {
  const [blockIndex] = point.path;
  const block = blockIndex === undefined ? undefined : document.children[blockIndex];
  let cursor = 1;

  if (
    !isValidPoint(document, point) ||
    blockIndex === undefined ||
    !isListNode(block)
  ) {
    return undefined;
  }

  let list: ListNode = block;
  let listPath: Path = [blockIndex];

  while (cursor < point.path.length) {
    const itemIndex = point.path[cursor];
    const childIndex = point.path[cursor + 1];
    const item: ListItemNode | undefined =
      itemIndex === undefined ? undefined : list.children[itemIndex];

    if (itemIndex === undefined || !item || childIndex === undefined) {
      return undefined;
    }

    if (cursor + 2 === point.path.length) {
      return childIndex < item.children.length
        ? { blockIndex, item, itemIndex, list, listPath, textIndex: childIndex }
        : undefined;
    }

    if (childIndex !== item.children.length || !item.nested) {
      return undefined;
    }

    listPath = [...listPath, itemIndex, childIndex];
    list = item.nested;
    cursor += 2;
  }

  return undefined;
}

function updateNestedList(
  list: ListNode,
  path: Path,
  update: (target: ListNode) => ListNode,
): ListNode {
  if (path.length === 0) {
    return update(list);
  }

  const [itemIndex, nestedIndex, ...rest] = path;
  const item = itemIndex === undefined ? undefined : list.children[itemIndex];

  if (!item || nestedIndex !== item.children.length || !item.nested) {
    throw new RangeError("list path must reference a nested list");
  }

  return {
    ...list,
    children: list.children.map((child, index) =>
      index === itemIndex
        ? { ...item, nested: updateNestedList(item.nested!, rest, update) }
        : child,
    ),
  };
}

export function updateListAtPath(
  document: DocumentNode,
  path: Path,
  update: (target: ListNode) => ListNode,
): DocumentNode {
  const [blockIndex, ...rest] = path;
  const block = blockIndex === undefined ? undefined : document.children[blockIndex];

  if (!isListNode(block)) {
    throw new RangeError("list path must reference a list block");
  }

  return {
    ...document,
    children: document.children.map((child, index) =>
      index === blockIndex ? updateNestedList(block, rest, update) : child,
    ),
  };
}

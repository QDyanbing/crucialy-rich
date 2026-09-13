import {
  createCodeBlock,
  createBulletList,
  createDivider,
  createHeading,
  createListItem,
  createOrderedList,
  createParagraph,
  createQuote,
  createText,
  createTaskItem,
  createTaskList,
  type BlockNode,
  type DocumentNode,
  type ListNode,
} from "../model";
import type { Path } from "../selection";
import type { InsertBlockOperation } from "./types";

function cloneBlock(block: BlockNode): BlockNode {
  if (block.type === "image") {
    return { ...block, children: [] };
  }

  if (block.type === "divider") {
    return createDivider();
  }

  if (
    block.type === "bulletList" ||
    block.type === "orderedList" ||
    block.type === "taskList"
  ) {
    const items = block.children.map((item) => cloneListItem(item));

    if (block.type === "taskList") {
      return createTaskList(items.filter((item) => item.type === "taskItem"));
    }

    const listItems = items.filter((item) => item.type === "listItem");

    return block.type === "bulletList"
      ? createBulletList(listItems)
      : createOrderedList(listItems);
  }

  const children = block.children.map((node) => createText(node.text, node.marks));

  switch (block.type) {
    case "codeBlock":
      return createCodeBlock(children);
    case "heading":
      return createHeading(block.level, children);
    case "paragraph":
      return createParagraph(children);
    case "quote":
      return createQuote(children);
  }
}

function cloneListItem(item: ListNode["children"][number]) {
  const children = item.children.map((node) => createText(node.text, node.marks));
  const nested = item.nested ? (cloneBlock(item.nested) as ListNode) : undefined;

  return item.type === "taskItem"
    ? createTaskItem(children, item.checked, nested)
    : createListItem(children, nested);
}

export function createInsertBlockOperation(
  path: Path,
  block: BlockNode,
): InsertBlockOperation {
  return {
    block: cloneBlock(block),
    path: [...path],
    type: "insert_block",
  };
}

function getInsertIndex(
  document: DocumentNode,
  operation: InsertBlockOperation,
): number {
  const [blockIndex, ...rest] = operation.path;

  if (
    rest.length > 0 ||
    blockIndex === undefined ||
    !Number.isInteger(blockIndex) ||
    blockIndex < 0 ||
    blockIndex > document.children.length
  ) {
    throw new RangeError("insert block path must reference a document position");
  }

  return blockIndex;
}

export function applyInsertBlock(
  document: DocumentNode,
  operation: InsertBlockOperation,
): DocumentNode {
  const blockIndex = getInsertIndex(document, operation);

  return {
    ...document,
    children: [
      ...document.children.slice(0, blockIndex),
      cloneBlock(operation.block),
      ...document.children.slice(blockIndex),
    ],
  };
}

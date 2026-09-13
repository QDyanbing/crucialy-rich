import {
  createBulletList,
  createListItem,
  createOrderedList,
  createTaskItem,
  createTaskList,
  createText,
  type BlockNode,
  type DocumentNode,
  type ListNode,
} from "../model";
import type { Point, RangeSelection } from "../selection";
import type { HistorySnapshot } from "./types";

function cloneBlock(block: BlockNode): BlockNode {
  if (block.type === "image") {
    return { ...block, children: [] };
  }

  if (block.type === "divider") {
    return { children: [], type: "divider" };
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

  const children = block.children.map((textNode) =>
    createText(textNode.text, textNode.marks),
  );

  if (block.type === "heading") {
    return { children, level: block.level, type: "heading" };
  }

  switch (block.type) {
    case "codeBlock":
      return {
        children: block.children.map((textNode) => createText(textNode.text)),
        type: "codeBlock",
      };
    case "paragraph":
      return { children, type: "paragraph" };
    case "quote":
      return { children, type: "quote" };
  }
}

function cloneListItem(item: ListNode["children"][number]) {
  const children = item.children.map((textNode) =>
    createText(textNode.text, textNode.marks),
  );
  const nested = item.nested ? (cloneBlock(item.nested) as ListNode) : undefined;

  return item.type === "taskItem"
    ? createTaskItem(children, item.checked, nested)
    : createListItem(children, nested);
}

function cloneDocument(document: DocumentNode): DocumentNode {
  return {
    children: document.children.map(cloneBlock),
    type: "document",
  };
}

function clonePoint(point: Point): Point {
  return {
    path: [...point.path],
    offset: point.offset,
  };
}

function cloneSelection(selection: RangeSelection): RangeSelection {
  return {
    anchor: clonePoint(selection.anchor),
    focus: clonePoint(selection.focus),
  };
}

export function createHistorySnapshot(
  document: DocumentNode,
  selection?: RangeSelection,
): HistorySnapshot {
  return selection
    ? {
        document: cloneDocument(document),
        selection: cloneSelection(selection),
      }
    : {
        document: cloneDocument(document),
      };
}

export function cloneHistorySnapshot(snapshot: HistorySnapshot): HistorySnapshot {
  return createHistorySnapshot(snapshot.document, snapshot.selection);
}

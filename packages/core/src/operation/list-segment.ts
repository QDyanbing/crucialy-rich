import type { ListNode } from "../model";

export function createListSegment(
  list: ListNode,
  startIndex: number,
  endIndex?: number,
): ListNode {
  const children = list.children.slice(startIndex, endIndex);

  if (list.type !== "orderedList") {
    return { children, type: list.type };
  }

  if (list.start === undefined && startIndex === 0) {
    return { children, type: "orderedList" };
  }

  return {
    children,
    start: (list.start ?? 1) + startIndex,
    type: "orderedList",
  };
}

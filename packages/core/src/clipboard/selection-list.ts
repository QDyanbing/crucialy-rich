import {
  createDocument,
  isListItemNode,
  isListNode,
  normalizeDocument,
  type DocumentNode,
  type ListNode,
} from "../model";
import { getNodeAtPath, normalizeRange, type RangeSelection } from "../selection";
import { clipClipboardText } from "./selection-blocks";
import { getClipboardText } from "./text";

export function getClipboardList(
  document: DocumentNode,
  selection: RangeSelection,
): ListNode | undefined {
  if (getClipboardText(document, selection) === undefined) return undefined;
  const range = normalizeRange(selection);
  const path = range.anchor.path.slice(0, -2);
  const endPath = range.focus.path.slice(0, -2);
  if (
    path.length !== endPath.length ||
    !path.every((part, index) => part === endPath[index])
  )
    return undefined;
  const list = getNodeAtPath(document, path);
  const start = range.anchor.path.at(-2)!;
  const end = range.focus.path.at(-2)!;
  if (!isListNode(list) || list.type === "taskList" || start >= end) return undefined;
  let firstNumber: number | undefined;
  if (list.type === "orderedList") {
    firstNumber = (list.start ?? 1) + start;
    if (!Number.isSafeInteger(list.start ?? 1) || !Number.isSafeInteger(firstNumber))
      return undefined;
  }
  const entries = list.children.slice(start, end + 1);
  if (!entries.every(isListItemNode)) return undefined;
  const children = entries.map((entry, index) => {
    const { nested, ...item } = entry;
    const children = clipClipboardText(entry.children, [...path, start + index], range);
    return nested && start + index < end
      ? { ...item, children, nested }
      : { ...item, children };
  });
  const fragment = normalizeDocument(
    createDocument([
      {
        ...list,
        children,
        ...(firstNumber === undefined ? {} : { start: firstNumber }),
      },
    ]),
  ).children[0];
  return isListNode(fragment) ? fragment : undefined;
}

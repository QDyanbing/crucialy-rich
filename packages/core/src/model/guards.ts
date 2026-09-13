import {
  HEADING_LEVELS,
  IMAGE_STATUSES,
  LIST_TYPES,
  type BlockNode,
  type BulletListNode,
  type CodeBlockNode,
  type DividerNode,
  type DocumentNode,
  type HeadingLevel,
  type HeadingNode,
  type ImageNode,
  type ImageStatus,
  type ListItemNode,
  type ListEntryNode,
  type ListNode,
  type ListType,
  type OrderedListNode,
  type ParagraphNode,
  type QuoteNode,
  type TextNode,
  type TaskItemNode,
  type TaskListNode,
  type TextBlockNode,
  type VoidBlockNode,
} from "./types";

const HEADING_LEVEL_SET = new Set<number>(HEADING_LEVELS);
const IMAGE_STATUS_SET = new Set<string>(IMAGE_STATUSES);
const LIST_TYPE_SET = new Set<string>(LIST_TYPES);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isTextNode(value: unknown): value is TextNode {
  return isRecord(value) && value.type === "text" && typeof value.text === "string";
}

export function isParagraphNode(value: unknown): value is ParagraphNode {
  return isRecord(value) && value.type === "paragraph" && Array.isArray(value.children);
}

export function isHeadingLevel(value: unknown): value is HeadingLevel {
  return typeof value === "number" && HEADING_LEVEL_SET.has(value);
}

export function isHeadingNode(value: unknown): value is HeadingNode {
  return (
    isRecord(value) &&
    value.type === "heading" &&
    isHeadingLevel(value.level) &&
    Array.isArray(value.children)
  );
}

export function isQuoteNode(value: unknown): value is QuoteNode {
  return isRecord(value) && value.type === "quote" && Array.isArray(value.children);
}

export function isCodeBlockNode(value: unknown): value is CodeBlockNode {
  return isRecord(value) && value.type === "codeBlock" && Array.isArray(value.children);
}

export function isDividerNode(value: unknown): value is DividerNode {
  return isRecord(value) && value.type === "divider" && Array.isArray(value.children);
}

export function isImageStatus(value: unknown): value is ImageStatus {
  return typeof value === "string" && IMAGE_STATUS_SET.has(value);
}

export function isImageNode(value: unknown): value is ImageNode {
  return isRecord(value) && value.type === "image" && Array.isArray(value.children);
}

export function isListType(value: unknown): value is ListType {
  return typeof value === "string" && LIST_TYPE_SET.has(value);
}

export function isListItemNode(value: unknown): value is ListItemNode {
  return isRecord(value) && value.type === "listItem" && Array.isArray(value.children);
}

export function isTaskItemNode(value: unknown): value is TaskItemNode {
  return (
    isRecord(value) &&
    value.type === "taskItem" &&
    typeof value.checked === "boolean" &&
    Array.isArray(value.children)
  );
}

export function isListEntryNode(value: unknown): value is ListEntryNode {
  return isListItemNode(value) || isTaskItemNode(value);
}

export function isBulletListNode(value: unknown): value is BulletListNode {
  return (
    isRecord(value) && value.type === "bulletList" && Array.isArray(value.children)
  );
}

export function isOrderedListNode(value: unknown): value is OrderedListNode {
  return (
    isRecord(value) && value.type === "orderedList" && Array.isArray(value.children)
  );
}

export function isTaskListNode(value: unknown): value is TaskListNode {
  return isRecord(value) && value.type === "taskList" && Array.isArray(value.children);
}

export function isListNode(value: unknown): value is ListNode {
  return isBulletListNode(value) || isOrderedListNode(value) || isTaskListNode(value);
}

export function isTextBlockNode(value: unknown): value is TextBlockNode {
  return (
    isCodeBlockNode(value) ||
    isHeadingNode(value) ||
    isParagraphNode(value) ||
    isQuoteNode(value)
  );
}

export function isVoidBlockNode(value: unknown): value is VoidBlockNode {
  return isDividerNode(value) || isImageNode(value);
}

export function isBlockNode(value: unknown): value is BlockNode {
  return isListNode(value) || isTextBlockNode(value) || isVoidBlockNode(value);
}

export function isDocumentNode(value: unknown): value is DocumentNode {
  return isRecord(value) && value.type === "document" && Array.isArray(value.children);
}

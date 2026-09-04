import { normalizeDocument, type DocumentNode } from "../model";
import type { Point, RangeSelection } from "../selection";
import { applyDeleteText } from "./delete-text";
import { applyInsertText } from "./insert-text";
import { applyInsertBlock, createInsertBlockOperation } from "./insert-block";
import { applyMergeBlock } from "./merge-block";
import { applySetBlockType } from "./set-block-type";
import { applySetLink } from "./set-link";
import { applySetMarkAttribute } from "./set-mark-attribute";
import { applySplitBlock } from "./split-block";
import { applyToggleMark } from "./toggle-mark";
import type { Operation, Transaction } from "./types";

function clonePoint(point: Point): Point {
  return {
    path: [...point.path],
    offset: point.offset,
  };
}

function cloneRange(range: RangeSelection): RangeSelection {
  return {
    anchor: clonePoint(range.anchor),
    focus: clonePoint(range.focus),
  };
}

export function cloneOperation(operation: Operation): Operation {
  switch (operation.type) {
    case "insert_block":
      return createInsertBlockOperation(operation.path, operation.block);
    case "delete_text":
      return {
        range: cloneRange(operation.range),
        type: "delete_text",
      };
    case "insert_text":
      return {
        point: clonePoint(operation.point),
        text: operation.text,
        type: "insert_text",
      };
    case "toggle_mark":
      return {
        mark: operation.mark,
        range: cloneRange(operation.range),
        type: "toggle_mark",
      };
    case "set_mark_attribute":
      return {
        attribute: operation.attribute,
        range: cloneRange(operation.range),
        type: "set_mark_attribute",
        value: operation.value,
      };
    case "set_link":
      return {
        link: operation.link ? { ...operation.link } : null,
        range: cloneRange(operation.range),
        type: "set_link",
      };
    case "set_block_type":
      return {
        block:
          operation.block.type === "heading"
            ? { ...operation.block }
            : { type: operation.block.type },
        path: [...operation.path],
        type: "set_block_type",
      };
    case "merge_block":
      return {
        point: clonePoint(operation.point),
        type: "merge_block",
      };
    case "split_block":
      return {
        point: clonePoint(operation.point),
        type: "split_block",
      };
  }
}

export function createTransaction(operations: Operation[] = []): Transaction {
  return {
    operations: operations.map(cloneOperation),
  };
}

export function applyOperation(
  document: DocumentNode,
  operation: Operation,
): DocumentNode {
  switch (operation.type) {
    case "insert_block":
      return applyInsertBlock(document, operation);
    case "delete_text":
      return applyDeleteText(document, operation);
    case "insert_text":
      return applyInsertText(document, operation);
    case "toggle_mark":
      return applyToggleMark(document, operation);
    case "set_mark_attribute":
      return applySetMarkAttribute(document, operation);
    case "set_link":
      return applySetLink(document, operation);
    case "set_block_type":
      return applySetBlockType(document, operation);
    case "merge_block":
      return applyMergeBlock(document, operation);
    case "split_block":
      return applySplitBlock(document, operation);
  }
}

export function applyTransaction(
  document: DocumentNode,
  transaction: Transaction,
): DocumentNode {
  return normalizeDocument(transaction.operations.reduce(applyOperation, document));
}

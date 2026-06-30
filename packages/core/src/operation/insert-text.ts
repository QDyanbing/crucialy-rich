import type { DocumentNode } from "../model";
import type { Point, RangeSelection } from "../selection";
import { isValidPoint } from "../selection";
import type { InsertTextOperation } from "./types";

export function createInsertTextOperation(
  point: Point,
  text: string,
): InsertTextOperation {
  return {
    point: {
      path: [...point.path],
      offset: point.offset,
    },
    text,
    type: "insert_text",
  };
}

function getInsertTextIndexes(
  document: DocumentNode,
  operation: InsertTextOperation,
): [number, number] {
  if (!isValidPoint(document, operation.point)) {
    throw new RangeError("insert text point must reference a text node");
  }

  const [blockIndex, textIndex] = operation.point.path;

  if (blockIndex === undefined || textIndex === undefined) {
    throw new RangeError("insert text point must reference a text node");
  }

  return [blockIndex, textIndex];
}

export function applyInsertText(
  document: DocumentNode,
  operation: InsertTextOperation,
): DocumentNode {
  const [blockIndex, textIndex] = getInsertTextIndexes(document, operation);

  if (operation.text.length === 0) {
    return document;
  }

  return {
    ...document,
    children: document.children.map((block, currentBlockIndex) =>
      currentBlockIndex === blockIndex
        ? {
            ...block,
            children: block.children.map((textNode, currentTextIndex) =>
              currentTextIndex === textIndex
                ? {
                    ...textNode,
                    text: `${textNode.text.slice(
                      0,
                      operation.point.offset,
                    )}${operation.text}${textNode.text.slice(operation.point.offset)}`,
                  }
                : textNode,
            ),
          }
        : block,
    ),
  };
}

export function createSelectionAfterInsertText(
  operation: InsertTextOperation,
): RangeSelection {
  const point = {
    path: [...operation.point.path],
    offset: operation.point.offset + operation.text.length,
  };

  return {
    anchor: point,
    focus: {
      path: [...point.path],
      offset: point.offset,
    },
  };
}

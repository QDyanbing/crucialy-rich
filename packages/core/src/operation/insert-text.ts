import type { DocumentNode } from "../model";
import type { Point, RangeSelection } from "../selection";
import { isValidPoint } from "../selection";
import type { InsertTextOperation } from "./types";
import { getTextTarget, replaceTextContainer } from "./text-target";

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

function getInsertTextTarget(document: DocumentNode, operation: InsertTextOperation) {
  if (!isValidPoint(document, operation.point)) {
    throw new RangeError("insert text point must reference a text node");
  }

  const target = getTextTarget(document, operation.point);

  if (!target) {
    throw new RangeError("insert text point must reference a text node");
  }

  return target;
}

export function applyInsertText(
  document: DocumentNode,
  operation: InsertTextOperation,
): DocumentNode {
  const target = getInsertTextTarget(document, operation);

  if (operation.text.length === 0) {
    return document;
  }

  return replaceTextContainer(document, target.containerPath, {
    ...target.container,
    children: target.container.children.map((textNode, currentTextIndex) =>
      currentTextIndex === target.textIndex
        ? {
            ...textNode,
            text: `${textNode.text.slice(0, operation.point.offset)}${operation.text}${textNode.text.slice(operation.point.offset)}`,
          }
        : textNode,
    ),
  });
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

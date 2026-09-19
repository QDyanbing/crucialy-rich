import type { DocumentNode } from "../model";
import type { RangeSelection } from "../selection";
import {
  getPointAtTextContainerOffset,
  getTextContainerOffset,
  getTextContainerPath,
  isCollapsed,
  isValidPoint,
  normalizeRange,
} from "../selection";
import type { DeleteTextOperation } from "./types";
import { getTextTarget, replaceTextContainer, type TextTarget } from "./text-target";

export function createDeleteTextOperation(range: RangeSelection): DeleteTextOperation {
  return {
    range: {
      anchor: {
        path: [...range.anchor.path],
        offset: range.anchor.offset,
      },
      focus: {
        path: [...range.focus.path],
        offset: range.focus.offset,
      },
    },
    type: "delete_text",
  };
}

function getDeleteTextIndexes(
  document: DocumentNode,
  operation: DeleteTextOperation,
): [TextTarget, TextTarget, RangeSelection] {
  const range = normalizeRange(operation.range);

  if (!isValidPoint(document, range.anchor) || !isValidPoint(document, range.focus)) {
    throw new RangeError("delete text range must reference text nodes");
  }

  const startTarget = getTextTarget(document, range.anchor);
  const endTarget = getTextTarget(document, range.focus);

  if (
    !startTarget ||
    !endTarget ||
    startTarget.containerPath.length !== endTarget.containerPath.length ||
    !startTarget.containerPath.every(
      (part, index) => part === endTarget.containerPath[index],
    )
  ) {
    throw new RangeError("delete text range must stay inside one text container");
  }

  return [startTarget, endTarget, range];
}

export function applyDeleteText(
  document: DocumentNode,
  operation: DeleteTextOperation,
): DocumentNode {
  const [startTarget, endTarget, range] = getDeleteTextIndexes(document, operation);

  if (isCollapsed(range)) {
    return document;
  }

  if (startTarget.textIndex === endTarget.textIndex) {
    return replaceTextContainer(document, startTarget.containerPath, {
      ...startTarget.container,
      children: startTarget.container.children.map((textNode, currentTextIndex) =>
        currentTextIndex === startTarget.textIndex
          ? {
              ...textNode,
              text: `${textNode.text.slice(0, range.anchor.offset)}${textNode.text.slice(range.focus.offset)}`,
            }
          : textNode,
      ),
    });
  }

  const startNode = startTarget.container.children[startTarget.textIndex]!;
  const endNode = endTarget.container.children[endTarget.textIndex]!;
  const prefix = startNode.text.slice(0, range.anchor.offset);
  const suffix = endNode.text.slice(range.focus.offset);
  const children = [
    ...startTarget.container.children.slice(0, startTarget.textIndex),
    ...(prefix.length > 0 ? [{ ...startNode, text: prefix }] : []),
    ...(suffix.length > 0 ? [{ ...endNode, text: suffix }] : []),
    ...startTarget.container.children.slice(endTarget.textIndex + 1),
  ];

  return replaceTextContainer(document, startTarget.containerPath, {
    ...startTarget.container,
    children: children.length > 0 ? children : [{ ...startNode, text: "" }],
  });
}

export function createSelectionAfterDeleteText(
  document: DocumentNode,
  operation: DeleteTextOperation,
): RangeSelection {
  const range = normalizeRange(operation.range);
  const containerPath = getTextContainerPath(range.anchor);
  const textOffset = getTextContainerOffset(document, range.anchor);

  if (!containerPath || textOffset === undefined) {
    throw new RangeError("delete text range must reference a text container");
  }

  const nextDocument = applyDeleteText(document, operation);
  const point = getPointAtTextContainerOffset(nextDocument, containerPath, textOffset, {
    affinity: "backward",
  });

  if (!point) {
    throw new RangeError("deleted text selection could not be restored");
  }

  return {
    anchor: {
      path: [...point.path],
      offset: point.offset,
    },
    focus: {
      path: [...point.path],
      offset: point.offset,
    },
  };
}

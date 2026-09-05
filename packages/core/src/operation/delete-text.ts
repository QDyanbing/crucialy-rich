import type { DocumentNode } from "../model";
import type { RangeSelection } from "../selection";
import { isCollapsed, isValidPoint, normalizeRange } from "../selection";
import type { DeleteTextOperation } from "./types";
import { getTextTarget, replaceTextContainer } from "./text-target";

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
): [NonNullable<ReturnType<typeof getTextTarget>>, RangeSelection] {
  const range = normalizeRange(operation.range);

  if (!isValidPoint(document, range.anchor) || !isValidPoint(document, range.focus)) {
    throw new RangeError("delete text range must reference text nodes");
  }

  const target = getTextTarget(document, range.anchor);

  if (
    !target ||
    range.anchor.path.length !== range.focus.path.length ||
    !range.anchor.path.every((part, index) => part === range.focus.path[index])
  ) {
    throw new RangeError("delete text range must stay inside one text node");
  }

  return [target, range];
}

export function applyDeleteText(
  document: DocumentNode,
  operation: DeleteTextOperation,
): DocumentNode {
  const [target, range] = getDeleteTextIndexes(document, operation);

  if (isCollapsed(range)) {
    return document;
  }

  return replaceTextContainer(document, target.containerPath, {
    ...target.container,
    children: target.container.children.map((textNode, currentTextIndex) =>
      currentTextIndex === target.textIndex
        ? {
            ...textNode,
            text: `${textNode.text.slice(0, range.anchor.offset)}${textNode.text.slice(range.focus.offset)}`,
          }
        : textNode,
    ),
  });
}

export function createSelectionAfterDeleteText(
  operation: DeleteTextOperation,
): RangeSelection {
  const range = normalizeRange(operation.range);
  const point = {
    path: [...range.anchor.path],
    offset: range.anchor.offset,
  };

  return {
    anchor: point,
    focus: {
      path: [...point.path],
      offset: point.offset,
    },
  };
}

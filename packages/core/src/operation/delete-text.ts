import type { DocumentNode } from "../model";
import type { RangeSelection } from "../selection";
import { isCollapsed, isValidPoint, normalizeRange } from "../selection";
import type { DeleteTextOperation } from "./types";

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
): [number, number, RangeSelection] {
  const range = normalizeRange(operation.range);

  if (!isValidPoint(document, range.anchor) || !isValidPoint(document, range.focus)) {
    throw new RangeError("delete text range must reference text nodes");
  }

  const [anchorBlockIndex, anchorTextIndex] = range.anchor.path;
  const [focusBlockIndex, focusTextIndex] = range.focus.path;

  if (
    anchorBlockIndex === undefined ||
    anchorTextIndex === undefined ||
    focusBlockIndex === undefined ||
    focusTextIndex === undefined ||
    anchorBlockIndex !== focusBlockIndex ||
    anchorTextIndex !== focusTextIndex
  ) {
    throw new RangeError("delete text range must stay inside one text node");
  }

  return [anchorBlockIndex, anchorTextIndex, range];
}

export function applyDeleteText(
  document: DocumentNode,
  operation: DeleteTextOperation,
): DocumentNode {
  const [blockIndex, textIndex, range] = getDeleteTextIndexes(document, operation);

  if (isCollapsed(range)) {
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
                      range.anchor.offset,
                    )}${textNode.text.slice(range.focus.offset)}`,
                  }
                : textNode,
            ),
          }
        : block,
    ),
  };
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

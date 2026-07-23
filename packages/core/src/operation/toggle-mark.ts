import {
  createText,
  toggleTextMark,
  type DocumentNode,
  type TextMarkType,
  type TextNode,
} from "../model";
import type { RangeSelection } from "../selection";
import { isCollapsed, isValidPoint, normalizeRange } from "../selection";
import type { ToggleMarkOperation } from "./types";

export function createToggleMarkOperation(
  range: RangeSelection,
  mark: TextMarkType,
): ToggleMarkOperation {
  return {
    mark,
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
    type: "toggle_mark",
  };
}

function getToggleMarkIndexes(
  document: DocumentNode,
  operation: ToggleMarkOperation,
): [number, number, RangeSelection] {
  const range = normalizeRange(operation.range);

  if (!isValidPoint(document, range.anchor) || !isValidPoint(document, range.focus)) {
    throw new RangeError("toggle mark range must reference text nodes");
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
    throw new RangeError("toggle mark range must stay inside one text node");
  }

  return [anchorBlockIndex, anchorTextIndex, range];
}

function createTextPart(text: string, source: TextNode): TextNode | undefined {
  return text.length > 0 ? createText(text, source.marks) : undefined;
}

function compactTextParts(parts: Array<TextNode | undefined>): TextNode[] {
  return parts.filter((part): part is TextNode => part !== undefined);
}

function createToggleMarkReplacement(
  textNode: TextNode,
  range: RangeSelection,
  mark: TextMarkType,
): TextNode[] {
  const before = textNode.text.slice(0, range.anchor.offset);
  const selected = textNode.text.slice(range.anchor.offset, range.focus.offset);
  const after = textNode.text.slice(range.focus.offset);
  const toggledMarks = toggleTextMark(textNode.marks, mark);
  const toggledText = createText(selected, toggledMarks);

  if (isCollapsed(range)) {
    return compactTextParts([
      createTextPart(before, textNode),
      toggledText,
      createTextPart(after, textNode),
    ]);
  }

  return compactTextParts([
    createTextPart(before, textNode),
    toggledText,
    createTextPart(after, textNode),
  ]);
}

export function applyToggleMark(
  document: DocumentNode,
  operation: ToggleMarkOperation,
): DocumentNode {
  const [blockIndex, textIndex, range] = getToggleMarkIndexes(document, operation);

  return {
    ...document,
    children: document.children.map((block, currentBlockIndex) =>
      currentBlockIndex === blockIndex
        ? {
            ...block,
            children: [
              ...block.children.slice(0, textIndex),
              ...createToggleMarkReplacement(
                block.children[textIndex]!,
                range,
                operation.mark,
              ),
              ...block.children.slice(textIndex + 1),
            ],
          }
        : block,
    ),
  };
}

export function createSelectionAfterToggleMark(
  document: DocumentNode,
  operation: ToggleMarkOperation,
): RangeSelection {
  const [blockIndex, textIndex, range] = getToggleMarkIndexes(document, operation);
  const selectedTextLength = range.focus.offset - range.anchor.offset;
  const targetTextIndex = textIndex + (range.anchor.offset > 0 ? 1 : 0);
  const point = {
    path: [blockIndex, targetTextIndex],
    offset: 0,
  };

  return isCollapsed(range)
    ? {
        anchor: point,
        focus: {
          path: [...point.path],
          offset: point.offset,
        },
      }
    : {
        anchor: point,
        focus: {
          path: [...point.path],
          offset: selectedTextLength,
        },
      };
}

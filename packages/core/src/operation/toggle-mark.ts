import {
  createText,
  mergeAdjacentTextNodes,
  toggleTextMark,
  type DocumentNode,
  type TextMarkType,
  type TextNode,
} from "../model";
import type { RangeSelection } from "../selection";
import { isCollapsed, isValidPoint, normalizeRange } from "../selection";
import type { ToggleMarkOperation } from "./types";

interface ToggleMarkTarget {
  blockIndex: number;
  endTextIndex: number;
  range: RangeSelection;
  startTextIndex: number;
}

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

function getToggleMarkTarget(
  document: DocumentNode,
  operation: ToggleMarkOperation,
): ToggleMarkTarget {
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
    anchorBlockIndex !== focusBlockIndex
  ) {
    throw new RangeError("toggle mark range must stay inside one paragraph");
  }

  return {
    blockIndex: anchorBlockIndex,
    endTextIndex: focusTextIndex,
    range,
    startTextIndex: anchorTextIndex,
  };
}

function createTextPart(text: string, source: TextNode): TextNode | undefined {
  return text.length > 0 ? createText(text, source.marks) : undefined;
}

function compactTextParts(parts: Array<TextNode | undefined>): TextNode[] {
  return parts.filter((part): part is TextNode => part !== undefined);
}

function createToggledTextPart(
  text: string,
  source: TextNode,
  mark: TextMarkType,
): TextNode | undefined {
  return text.length > 0
    ? createText(text, toggleTextMark(source.marks, mark))
    : undefined;
}

function createCollapsedToggleMarkReplacement(
  textNode: TextNode,
  range: RangeSelection,
  mark: TextMarkType,
): TextNode[] {
  const before = textNode.text.slice(0, range.anchor.offset);
  const after = textNode.text.slice(range.focus.offset);
  const toggledMarks = toggleTextMark(textNode.marks, mark);

  return compactTextParts([
    createTextPart(before, textNode),
    createText("", toggledMarks),
    createTextPart(after, textNode),
  ]);
}

function createToggleMarkReplacement(
  textNodes: readonly TextNode[],
  target: ToggleMarkTarget,
  mark: TextMarkType,
): TextNode[] {
  if (isCollapsed(target.range)) {
    return createCollapsedToggleMarkReplacement(
      textNodes[target.startTextIndex]!,
      target.range,
      mark,
    );
  }

  const parts: Array<TextNode | undefined> = [];

  textNodes.forEach((textNode, textIndex) => {
    if (textIndex < target.startTextIndex || textIndex > target.endTextIndex) {
      return;
    }

    const selectionStart =
      textIndex === target.startTextIndex ? target.range.anchor.offset : 0;
    const selectionEnd =
      textIndex === target.endTextIndex
        ? target.range.focus.offset
        : textNode.text.length;

    if (textIndex === target.startTextIndex) {
      parts.push(createTextPart(textNode.text.slice(0, selectionStart), textNode));
    }

    parts.push(
      createToggledTextPart(
        textNode.text.slice(selectionStart, selectionEnd),
        textNode,
        mark,
      ),
    );

    if (textIndex === target.endTextIndex) {
      parts.push(createTextPart(textNode.text.slice(selectionEnd), textNode));
    }
  });

  return compactTextParts(parts);
}

export function applyToggleMark(
  document: DocumentNode,
  operation: ToggleMarkOperation,
): DocumentNode {
  const target = getToggleMarkTarget(document, operation);

  return {
    ...document,
    children: document.children.map((block, currentBlockIndex) =>
      currentBlockIndex === target.blockIndex
        ? {
            ...block,
            children: mergeAdjacentTextNodes([
              ...block.children.slice(0, target.startTextIndex),
              ...createToggleMarkReplacement(block.children, target, operation.mark),
              ...block.children.slice(target.endTextIndex + 1),
            ]),
          }
        : block,
    ),
  };
}

export function createSelectionAfterToggleMark(
  document: DocumentNode,
  operation: ToggleMarkOperation,
): RangeSelection {
  const { blockIndex, range, startTextIndex } = getToggleMarkTarget(
    document,
    operation,
  );
  const selectedTextLength = range.focus.offset - range.anchor.offset;
  const targetTextIndex = startTextIndex + (range.anchor.offset > 0 ? 1 : 0);
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

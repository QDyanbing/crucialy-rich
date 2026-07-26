import {
  areTextMarksEqual,
  createText,
  hasTextMark,
  mergeAdjacentTextNodes,
  setTextMark,
  toggleTextMark,
  type DocumentNode,
  type TextMarkType,
  type TextNode,
} from "../model";
import type { RangeSelection } from "../selection";
import {
  getParagraphTextOffset,
  getPointAtParagraphTextOffset,
  isCollapsed,
  isValidPoint,
  normalizeRange,
} from "../selection";
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

function createMarkedTextPart(
  text: string,
  source: TextNode,
  mark: TextMarkType,
  active: boolean,
): TextNode | undefined {
  return text.length > 0
    ? createText(text, setTextMark(source.marks, mark, active))
    : undefined;
}

function shouldAddTextMark(
  textNodes: readonly TextNode[],
  target: ToggleMarkTarget,
  mark: TextMarkType,
): boolean {
  for (
    let textIndex = target.startTextIndex;
    textIndex <= target.endTextIndex;
    textIndex += 1
  ) {
    const textNode = textNodes[textIndex]!;
    const selectionStart =
      textIndex === target.startTextIndex ? target.range.anchor.offset : 0;
    const selectionEnd =
      textIndex === target.endTextIndex
        ? target.range.focus.offset
        : textNode.text.length;

    if (selectionStart < selectionEnd && !hasTextMark(textNode.marks, mark)) {
      return true;
    }
  }

  return false;
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
  const active = shouldAddTextMark(textNodes, target, mark);

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
      createMarkedTextPart(
        textNode.text.slice(selectionStart, selectionEnd),
        textNode,
        mark,
        active,
      ),
    );

    if (textIndex === target.endTextIndex) {
      parts.push(createTextPart(textNode.text.slice(selectionEnd), textNode));
    }
  });

  return compactTextParts(parts);
}

function findCollapsedMarkPlaceholder(
  document: DocumentNode,
  blockIndex: number,
  textOffset: number,
  textNode: TextNode,
  mark: TextMarkType,
) {
  const block = document.children[blockIndex];
  const toggledMarks = toggleTextMark(textNode.marks, mark);

  if (!block) {
    return undefined;
  }

  let cursor = 0;

  for (let textIndex = 0; textIndex < block.children.length; textIndex += 1) {
    const currentText = block.children[textIndex]!;

    if (
      currentText.text.length === 0 &&
      cursor === textOffset &&
      areTextMarksEqual(currentText.marks, toggledMarks)
    ) {
      return {
        offset: 0,
        path: [blockIndex, textIndex],
      };
    }

    cursor += currentText.text.length;
  }

  return undefined;
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
  const target = getToggleMarkTarget(document, operation);
  const startOffset = getParagraphTextOffset(document, target.range.anchor);
  const endOffset = getParagraphTextOffset(document, target.range.focus);
  const nextDocument = applyToggleMark(document, operation);

  if (startOffset === undefined || endOffset === undefined) {
    throw new RangeError("toggle mark range must reference text nodes");
  }

  if (isCollapsed(target.range)) {
    const textNode =
      document.children[target.blockIndex]?.children[target.startTextIndex];

    if (!textNode) {
      throw new RangeError("toggle mark range must reference text nodes");
    }

    const point =
      findCollapsedMarkPlaceholder(
        nextDocument,
        target.blockIndex,
        startOffset,
        textNode,
        operation.mark,
      ) ??
      getPointAtParagraphTextOffset(nextDocument, target.blockIndex, startOffset, {
        affinity: "forward",
      });

    if (!point) {
      throw new RangeError("toggle mark selection cannot be mapped");
    }

    return {
      anchor: point,
      focus: {
        offset: point.offset,
        path: [...point.path],
      },
    };
  }

  const anchor = getPointAtParagraphTextOffset(
    nextDocument,
    target.blockIndex,
    startOffset,
    { affinity: "forward" },
  );
  const focus = getPointAtParagraphTextOffset(
    nextDocument,
    target.blockIndex,
    endOffset,
    { affinity: "backward" },
  );

  if (!anchor || !focus) {
    throw new RangeError("toggle mark selection cannot be mapped");
  }

  return {
    anchor,
    focus,
  };
}

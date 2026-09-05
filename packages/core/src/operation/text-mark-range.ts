import {
  areTextMarksEqual,
  createText,
  isTextBlockNode,
  type DocumentNode,
  type TextMarks,
  type TextNode,
} from "../model";
import {
  getBlockTextOffset,
  getPointAtBlockTextOffset,
  isCollapsed,
  isValidPoint,
  normalizeRange,
  type RangeSelection,
} from "../selection";

export interface TextMarkRangeTarget {
  blockIndex: number;
  endTextIndex: number;
  range: RangeSelection;
  startTextIndex: number;
}

export function getTextMarkRangeTarget(
  document: DocumentNode,
  selection: RangeSelection,
  operationLabel: string,
): TextMarkRangeTarget {
  const range = normalizeRange(selection);

  if (!isValidPoint(document, range.anchor) || !isValidPoint(document, range.focus)) {
    throw new RangeError(`${operationLabel} range must reference text nodes`);
  }

  const [anchorBlockIndex, anchorTextIndex] = range.anchor.path;
  const [focusBlockIndex, focusTextIndex] = range.focus.path;

  if (
    range.anchor.path.length !== 2 ||
    range.focus.path.length !== 2 ||
    anchorBlockIndex === undefined ||
    anchorTextIndex === undefined ||
    focusBlockIndex === undefined ||
    focusTextIndex === undefined ||
    anchorBlockIndex !== focusBlockIndex
  ) {
    throw new RangeError(`${operationLabel} range must stay inside one block`);
  }

  if (document.children[anchorBlockIndex]?.type === "codeBlock") {
    throw new RangeError(`${operationLabel} does not support code blocks`);
  }

  return {
    blockIndex: anchorBlockIndex,
    endTextIndex: focusTextIndex,
    range,
    startTextIndex: anchorTextIndex,
  };
}

export function createTextPart(text: string, source: TextNode): TextNode | undefined {
  return text.length > 0 ? createText(text, source.marks) : undefined;
}

export function compactTextParts(parts: Array<TextNode | undefined>): TextNode[] {
  return parts.filter((part): part is TextNode => part !== undefined);
}

function findCollapsedMarkPlaceholder(
  document: DocumentNode,
  blockIndex: number,
  textOffset: number,
  expectedMarks: TextMarks | undefined,
) {
  const block = document.children[blockIndex];

  if (!isTextBlockNode(block)) {
    return undefined;
  }

  let cursor = 0;

  for (let textIndex = 0; textIndex < block.children.length; textIndex += 1) {
    const currentText = block.children[textIndex]!;

    if (
      currentText.text.length === 0 &&
      cursor === textOffset &&
      areTextMarksEqual(currentText.marks, expectedMarks)
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

export function createSelectionAfterTextMarkChange(
  document: DocumentNode,
  target: TextMarkRangeTarget,
  nextDocument: DocumentNode,
  collapsedMarks: TextMarks | undefined,
  operationLabel: string,
): RangeSelection {
  const startOffset = getBlockTextOffset(document, target.range.anchor);
  const endOffset = getBlockTextOffset(document, target.range.focus);

  if (startOffset === undefined || endOffset === undefined) {
    throw new RangeError(`${operationLabel} range must reference text nodes`);
  }

  if (isCollapsed(target.range)) {
    const point =
      findCollapsedMarkPlaceholder(
        nextDocument,
        target.blockIndex,
        startOffset,
        collapsedMarks,
      ) ??
      getPointAtBlockTextOffset(nextDocument, target.blockIndex, startOffset, {
        affinity: "forward",
      });

    if (!point) {
      throw new RangeError(`${operationLabel} selection cannot be mapped`);
    }

    return {
      anchor: point,
      focus: {
        offset: point.offset,
        path: [...point.path],
      },
    };
  }

  const anchor = getPointAtBlockTextOffset(
    nextDocument,
    target.blockIndex,
    startOffset,
    { affinity: "forward" },
  );
  const focus = getPointAtBlockTextOffset(nextDocument, target.blockIndex, endOffset, {
    affinity: "backward",
  });

  if (!anchor || !focus) {
    throw new RangeError(`${operationLabel} selection cannot be mapped`);
  }

  return {
    anchor,
    focus,
  };
}

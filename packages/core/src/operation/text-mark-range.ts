import {
  areTextMarksEqual,
  createText,
  isListEntryNode,
  isTextBlockNode,
  type DocumentNode,
  type ListEntryNode,
  type TextMarks,
  type TextBlockNode,
  type TextNode,
} from "../model";
import {
  getNodeAtPath,
  getPointAtTextContainerOffset,
  getTextContainerOffset,
  isCollapsed,
  isSameTextContainer,
  isValidPoint,
  normalizeRange,
  type Path,
  type RangeSelection,
} from "../selection";
import { getTextTarget } from "./text-target";

export interface TextMarkRangeTarget {
  blockIndex: number;
  container: ListEntryNode | TextBlockNode;
  containerPath: Path;
  endTextIndex: number;
  range: RangeSelection;
  startTextIndex: number;
}

export function getTextMarkRangeTarget(
  document: DocumentNode,
  selection: RangeSelection,
  operationLabel: string,
  allowNested = false,
): TextMarkRangeTarget {
  const range = normalizeRange(selection);

  if (!isValidPoint(document, range.anchor) || !isValidPoint(document, range.focus)) {
    throw new RangeError(`${operationLabel} range must reference text nodes`);
  }

  const anchorTarget = getTextTarget(document, range.anchor);
  const focusTarget = getTextTarget(document, range.focus);
  const anchorBlockIndex = range.anchor.path[0];

  if (
    anchorBlockIndex === undefined ||
    !anchorTarget ||
    !focusTarget ||
    !isSameTextContainer(range.anchor, range.focus)
  ) {
    throw new RangeError(`${operationLabel} range must stay inside one block`);
  }

  if (!allowNested && anchorTarget.containerPath.length !== 1) {
    throw new RangeError(`${operationLabel} range must stay inside one block`);
  }

  if (anchorTarget.container.type === "codeBlock") {
    throw new RangeError(`${operationLabel} does not support code blocks`);
  }

  return {
    blockIndex: anchorBlockIndex,
    container: anchorTarget.container,
    containerPath: anchorTarget.containerPath,
    endTextIndex: focusTarget.textIndex,
    range,
    startTextIndex: anchorTarget.textIndex,
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
  containerPath: Path,
  textOffset: number,
  expectedMarks: TextMarks | undefined,
) {
  const container = getNodeAtPath(document, containerPath);

  if (!isTextBlockNode(container) && !isListEntryNode(container)) {
    return undefined;
  }

  let cursor = 0;

  for (let textIndex = 0; textIndex < container.children.length; textIndex += 1) {
    const currentText = container.children[textIndex]!;

    if (
      currentText.text.length === 0 &&
      cursor === textOffset &&
      areTextMarksEqual(currentText.marks, expectedMarks)
    ) {
      return {
        offset: 0,
        path: [...containerPath, textIndex],
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
  const startOffset = getTextContainerOffset(document, target.range.anchor);
  const endOffset = getTextContainerOffset(document, target.range.focus);

  if (startOffset === undefined || endOffset === undefined) {
    throw new RangeError(`${operationLabel} range must reference text nodes`);
  }

  if (isCollapsed(target.range)) {
    const point =
      findCollapsedMarkPlaceholder(
        nextDocument,
        target.containerPath,
        startOffset,
        collapsedMarks,
      ) ??
      getPointAtTextContainerOffset(nextDocument, target.containerPath, startOffset, {
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

  const anchor = getPointAtTextContainerOffset(
    nextDocument,
    target.containerPath,
    startOffset,
    { affinity: "forward" },
  );
  const focus = getPointAtTextContainerOffset(
    nextDocument,
    target.containerPath,
    endOffset,
    { affinity: "backward" },
  );

  if (!anchor || !focus) {
    throw new RangeError(`${operationLabel} selection cannot be mapped`);
  }

  return {
    anchor,
    focus,
  };
}

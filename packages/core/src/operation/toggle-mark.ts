import {
  createText,
  hasTextMark,
  isTextBlockNode,
  mergeAdjacentTextNodes,
  setTextMark,
  toggleTextMark,
  type DocumentNode,
  type TextMarkType,
  type TextNode,
} from "../model";
import type { RangeSelection } from "../selection";
import { isCollapsed } from "../selection";
import type { ToggleMarkOperation } from "./types";
import {
  compactTextParts,
  createSelectionAfterTextMarkChange,
  createTextPart,
  getTextMarkRangeTarget,
  type TextMarkRangeTarget,
} from "./text-mark-range";

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
  target: TextMarkRangeTarget,
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
  target: TextMarkRangeTarget,
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

export function applyToggleMark(
  document: DocumentNode,
  operation: ToggleMarkOperation,
): DocumentNode {
  const target = getTextMarkRangeTarget(document, operation.range, "toggle mark");

  return {
    ...document,
    children: document.children.map((block, currentBlockIndex) =>
      currentBlockIndex === target.blockIndex && isTextBlockNode(block)
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
  const target = getTextMarkRangeTarget(document, operation.range, "toggle mark");
  const nextDocument = applyToggleMark(document, operation);
  const textNode =
    document.children[target.blockIndex]?.children[target.startTextIndex];

  if (!textNode) {
    throw new RangeError("toggle mark range must reference text nodes");
  }

  return createSelectionAfterTextMarkChange(
    document,
    target,
    nextDocument,
    toggleTextMark(textNode.marks, operation.mark),
    "toggle mark",
  );
}

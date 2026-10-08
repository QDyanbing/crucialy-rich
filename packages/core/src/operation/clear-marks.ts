import {
  createText,
  isTextBlockNode,
  mergeAdjacentTextNodes,
  type DocumentNode,
  type TextNode,
} from "../model";
import { isCollapsed, type RangeSelection } from "../selection";
import {
  compactTextParts,
  createTextPart,
  getTextMarkRangeTarget,
  type TextMarkRangeTarget,
} from "./text-mark-range";
import type { ClearMarksOperation } from "./types";

export function createClearMarksOperation(range: RangeSelection): ClearMarksOperation {
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
    type: "clear_marks",
  };
}

function createClearMarksReplacement(
  textNodes: readonly TextNode[],
  target: TextMarkRangeTarget,
): TextNode[] {
  if (isCollapsed(target.range)) {
    const textNode = textNodes[target.startTextIndex]!;

    return compactTextParts([
      createTextPart(textNode.text.slice(0, target.range.anchor.offset), textNode),
      createText(),
      createTextPart(textNode.text.slice(target.range.focus.offset), textNode),
    ]);
  }

  const parts: Array<TextNode | undefined> = [];

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

    if (textIndex === target.startTextIndex) {
      parts.push(createTextPart(textNode.text.slice(0, selectionStart), textNode));
    }

    if (selectionStart < selectionEnd) {
      parts.push(createText(textNode.text.slice(selectionStart, selectionEnd)));
    }

    if (textIndex === target.endTextIndex) {
      parts.push(createTextPart(textNode.text.slice(selectionEnd), textNode));
    }
  }

  return compactTextParts(parts);
}

export function applyClearMarks(
  document: DocumentNode,
  operation: ClearMarksOperation,
): DocumentNode {
  const target = getTextMarkRangeTarget(document, operation.range, "clear marks");

  return {
    ...document,
    children: document.children.map((block, currentBlockIndex) =>
      currentBlockIndex === target.blockIndex && isTextBlockNode(block)
        ? {
            ...block,
            children: mergeAdjacentTextNodes([
              ...block.children.slice(0, target.startTextIndex),
              ...createClearMarksReplacement(block.children, target),
              ...block.children.slice(target.endTextIndex + 1),
            ]),
          }
        : block,
    ),
  };
}

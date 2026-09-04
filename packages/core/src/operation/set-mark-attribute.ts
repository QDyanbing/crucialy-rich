import {
  createText,
  isValidTextMarkAttributeValue,
  isTextBlockNode,
  mergeAdjacentTextNodes,
  normalizeTextMarks,
  removeTextMarkAttribute,
  type DocumentNode,
  type TextMarkAttributes,
  type TextMarkAttributeType,
  type TextMarks,
  type TextNode,
} from "../model";
import { isCollapsed, type RangeSelection } from "../selection";
import {
  compactTextParts,
  createSelectionAfterTextMarkChange,
  createTextPart,
  getTextMarkRangeTarget,
  type TextMarkRangeTarget,
} from "./text-mark-range";
import type { SetMarkAttributeOperation } from "./types";

export function createSetMarkAttributeOperation<
  TAttribute extends TextMarkAttributeType,
>(
  range: RangeSelection,
  attribute: TAttribute,
  value: TextMarkAttributes[TAttribute] | null,
): SetMarkAttributeOperation<TAttribute> {
  if (value !== null && !isValidTextMarkAttributeValue(attribute, value)) {
    throw new RangeError(`invalid ${attribute} mark value`);
  }

  return {
    attribute,
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
    type: "set_mark_attribute",
    value,
  };
}

function getUpdatedMarks(
  marks: TextMarks | undefined,
  operation: SetMarkAttributeOperation,
): TextMarks | undefined {
  if (operation.value === null) {
    return removeTextMarkAttribute(marks, operation.attribute);
  }

  if (!isValidTextMarkAttributeValue(operation.attribute, operation.value)) {
    throw new RangeError(`invalid ${operation.attribute} mark value`);
  }

  return normalizeTextMarks({
    ...(marks ?? {}),
    [operation.attribute]: operation.value,
  });
}

function createUpdatedTextPart(
  text: string,
  source: TextNode,
  operation: SetMarkAttributeOperation,
): TextNode | undefined {
  return text.length > 0
    ? createText(text, getUpdatedMarks(source.marks, operation))
    : undefined;
}

function createCollapsedReplacement(
  textNode: TextNode,
  range: RangeSelection,
  operation: SetMarkAttributeOperation,
): TextNode[] {
  const before = textNode.text.slice(0, range.anchor.offset);
  const after = textNode.text.slice(range.focus.offset);

  return compactTextParts([
    createTextPart(before, textNode),
    createText("", getUpdatedMarks(textNode.marks, operation)),
    createTextPart(after, textNode),
  ]);
}

function createRangeReplacement(
  textNodes: readonly TextNode[],
  target: TextMarkRangeTarget,
  operation: SetMarkAttributeOperation,
): TextNode[] {
  if (isCollapsed(target.range)) {
    return createCollapsedReplacement(
      textNodes[target.startTextIndex]!,
      target.range,
      operation,
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
      createUpdatedTextPart(
        textNode.text.slice(selectionStart, selectionEnd),
        textNode,
        operation,
      ),
    );

    if (textIndex === target.endTextIndex) {
      parts.push(createTextPart(textNode.text.slice(selectionEnd), textNode));
    }
  });

  return compactTextParts(parts);
}

export function applySetMarkAttribute(
  document: DocumentNode,
  operation: SetMarkAttributeOperation,
): DocumentNode {
  const target = getTextMarkRangeTarget(
    document,
    operation.range,
    "set mark attribute",
  );

  return {
    ...document,
    children: document.children.map((block, blockIndex) =>
      blockIndex === target.blockIndex && isTextBlockNode(block)
        ? {
            ...block,
            children: mergeAdjacentTextNodes([
              ...block.children.slice(0, target.startTextIndex),
              ...createRangeReplacement(block.children, target, operation),
              ...block.children.slice(target.endTextIndex + 1),
            ]),
          }
        : block,
    ),
  };
}

export function createSelectionAfterSetMarkAttribute(
  document: DocumentNode,
  operation: SetMarkAttributeOperation,
): RangeSelection {
  const target = getTextMarkRangeTarget(
    document,
    operation.range,
    "set mark attribute",
  );
  const textNode =
    document.children[target.blockIndex]?.children[target.startTextIndex];

  if (!textNode) {
    throw new RangeError("set mark attribute range must reference text nodes");
  }

  return createSelectionAfterTextMarkChange(
    document,
    target,
    applySetMarkAttribute(document, operation),
    getUpdatedMarks(textNode.marks, operation),
    "set mark attribute",
  );
}

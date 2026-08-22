import {
  createText,
  mergeAdjacentTextNodes,
  normalizeLinkMark,
  removeLinkMark,
  setLinkMark,
  type DocumentNode,
  type LinkMarkAttributes,
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
import type { SetLinkOperation } from "./types";

export function createSetLinkOperation(
  range: RangeSelection,
  link: LinkMarkAttributes | null,
): SetLinkOperation {
  let normalizedLink: LinkMarkAttributes | null = null;

  if (link !== null) {
    const candidate = normalizeLinkMark(link);

    if (candidate === undefined) {
      throw new RangeError("invalid link mark");
    }

    normalizedLink = candidate;
  }

  return {
    link: normalizedLink,
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
    type: "set_link",
  };
}

function getUpdatedMarks(
  marks: TextMarks | undefined,
  link: LinkMarkAttributes | null,
): TextMarks | undefined {
  return link === null ? removeLinkMark(marks) : setLinkMark(marks, link);
}

function createUpdatedTextPart(
  text: string,
  source: TextNode,
  link: LinkMarkAttributes | null,
): TextNode | undefined {
  return text.length > 0
    ? createText(text, getUpdatedMarks(source.marks, link))
    : undefined;
}

function createCollapsedReplacement(
  textNode: TextNode,
  range: RangeSelection,
  link: LinkMarkAttributes | null,
): TextNode[] {
  const before = textNode.text.slice(0, range.anchor.offset);
  const after = textNode.text.slice(range.focus.offset);

  return compactTextParts([
    createTextPart(before, textNode),
    createText("", getUpdatedMarks(textNode.marks, link)),
    createTextPart(after, textNode),
  ]);
}

function createRangeReplacement(
  textNodes: readonly TextNode[],
  target: TextMarkRangeTarget,
  link: LinkMarkAttributes | null,
): TextNode[] {
  if (isCollapsed(target.range)) {
    return createCollapsedReplacement(
      textNodes[target.startTextIndex]!,
      target.range,
      link,
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
        link,
      ),
    );

    if (textIndex === target.endTextIndex) {
      parts.push(createTextPart(textNode.text.slice(selectionEnd), textNode));
    }
  });

  return compactTextParts(parts);
}

export function applySetLink(
  document: DocumentNode,
  operation: SetLinkOperation,
): DocumentNode {
  const target = getTextMarkRangeTarget(document, operation.range, "set link");

  return {
    ...document,
    children: document.children.map((block, blockIndex) =>
      blockIndex === target.blockIndex
        ? {
            ...block,
            children: mergeAdjacentTextNodes([
              ...block.children.slice(0, target.startTextIndex),
              ...createRangeReplacement(block.children, target, operation.link),
              ...block.children.slice(target.endTextIndex + 1),
            ]),
          }
        : block,
    ),
  };
}

export function createSelectionAfterSetLink(
  document: DocumentNode,
  operation: SetLinkOperation,
): RangeSelection {
  const target = getTextMarkRangeTarget(document, operation.range, "set link");
  const textNode =
    document.children[target.blockIndex]?.children[target.startTextIndex];

  if (!textNode) {
    throw new RangeError("set link range must reference text nodes");
  }

  return createSelectionAfterTextMarkChange(
    document,
    target,
    applySetLink(document, operation),
    getUpdatedMarks(textNode.marks, operation.link),
    "set link",
  );
}

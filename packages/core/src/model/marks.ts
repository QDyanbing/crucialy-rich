import {
  TEXT_MARK_ATTRIBUTE_TYPES,
  TEXT_MARK_TYPES,
  type TextMarkAttributes,
  type TextMarkAttributeType,
  type TextMarks,
  type TextMarkType,
  type TextNode,
} from "./types";
import { areLinkMarksEqual, normalizeLinkMark } from "./link";
import type { LinkMarkAttributes } from "./types";

export const MIN_FONT_SIZE = 8;
export const MAX_FONT_SIZE = 72;

const SHORT_HEX_COLOR_PATTERN = /^#[0-9a-f]{3}$/i;
const FULL_HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isValidFontSize(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= MIN_FONT_SIZE &&
    value <= MAX_FONT_SIZE
  );
}

export function sanitizeHexColor(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const color = value.trim().toLowerCase();

  if (FULL_HEX_COLOR_PATTERN.test(color)) {
    return color;
  }

  if (SHORT_HEX_COLOR_PATTERN.test(color)) {
    const [red, green, blue] = color.slice(1);

    return `#${red}${red}${green}${green}${blue}${blue}`;
  }

  return undefined;
}

export function isValidTextMarkAttributeValue<TAttribute extends TextMarkAttributeType>(
  attribute: TAttribute,
  value: unknown,
): value is TextMarkAttributes[TAttribute] {
  switch (attribute) {
    case "fontSize":
      return isValidFontSize(value);
    case "textColor":
      return sanitizeHexColor(value) !== undefined;
    case "backgroundColor":
      return sanitizeHexColor(value) !== undefined;
  }
}

export function normalizeTextMarks(value: unknown): TextMarks | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const marks: TextMarks = {};

  TEXT_MARK_TYPES.forEach((mark) => {
    if (value[mark] === true) {
      marks[mark] = true;
    }
  });

  if (isValidTextMarkAttributeValue("fontSize", value.fontSize)) {
    marks.fontSize = value.fontSize;
  }

  const textColor = sanitizeHexColor(value.textColor);

  if (textColor !== undefined) {
    marks.textColor = textColor;
  }

  const backgroundColor = sanitizeHexColor(value.backgroundColor);

  if (backgroundColor !== undefined) {
    marks.backgroundColor = backgroundColor;
  }

  const link = normalizeLinkMark(value.link);

  if (link !== undefined) {
    marks.link = link;
  }

  return Object.keys(marks).length > 0 ? marks : undefined;
}

export function hasTextMark(marks: TextMarks | undefined, mark: TextMarkType): boolean {
  return marks?.[mark] === true;
}

export function addTextMark(
  marks: TextMarks | undefined,
  mark: TextMarkType,
): TextMarks {
  return { ...(normalizeTextMarks(marks) ?? {}), [mark]: true };
}

export function removeTextMark(
  marks: TextMarks | undefined,
  mark: TextMarkType,
): TextMarks | undefined {
  const next = { ...(normalizeTextMarks(marks) ?? {}) };
  delete next[mark];

  return Object.keys(next).length > 0 ? next : undefined;
}

export function toggleTextMark(
  marks: TextMarks | undefined,
  mark: TextMarkType,
): TextMarks | undefined {
  return hasTextMark(marks, mark)
    ? removeTextMark(marks, mark)
    : addTextMark(marks, mark);
}

export function setTextMark(
  marks: TextMarks | undefined,
  mark: TextMarkType,
  active: boolean,
): TextMarks | undefined {
  return active ? addTextMark(marks, mark) : removeTextMark(marks, mark);
}

export function getTextMarkAttribute<TAttribute extends TextMarkAttributeType>(
  marks: TextMarks | undefined,
  attribute: TAttribute,
): TextMarkAttributes[TAttribute] | undefined {
  return normalizeTextMarks(marks)?.[attribute] as
    | TextMarkAttributes[TAttribute]
    | undefined;
}

export function setTextMarkAttribute<TAttribute extends TextMarkAttributeType>(
  marks: TextMarks | undefined,
  attribute: TAttribute,
  value: TextMarkAttributes[TAttribute],
): TextMarks | undefined {
  return normalizeTextMarks({ ...(marks ?? {}), [attribute]: value });
}

export function removeTextMarkAttribute(
  marks: TextMarks | undefined,
  attribute: TextMarkAttributeType,
): TextMarks | undefined {
  const next = { ...(normalizeTextMarks(marks) ?? {}) };
  Reflect.deleteProperty(next, attribute);

  return normalizeTextMarks(next);
}

export function getLinkMark(
  marks: TextMarks | undefined,
): LinkMarkAttributes | undefined {
  return normalizeLinkMark(marks?.link);
}

export function setLinkMark(
  marks: TextMarks | undefined,
  link: LinkMarkAttributes,
): TextMarks | undefined {
  return normalizeTextMarks({ ...(marks ?? {}), link });
}

export function removeLinkMark(marks: TextMarks | undefined): TextMarks | undefined {
  const next = { ...(normalizeTextMarks(marks) ?? {}) };
  Reflect.deleteProperty(next, "link");

  return normalizeTextMarks(next);
}

export function areTextMarksEqual(
  left: TextMarks | undefined,
  right: TextMarks | undefined,
): boolean {
  const normalizedLeft = normalizeTextMarks(left);
  const normalizedRight = normalizeTextMarks(right);

  return (
    TEXT_MARK_TYPES.every(
      (mark) =>
        hasTextMark(normalizedLeft, mark) === hasTextMark(normalizedRight, mark),
    ) &&
    TEXT_MARK_ATTRIBUTE_TYPES.every(
      (attribute) => normalizedLeft?.[attribute] === normalizedRight?.[attribute],
    ) &&
    areLinkMarksEqual(normalizedLeft?.link, normalizedRight?.link)
  );
}

function createNormalizedTextNode(node: TextNode): TextNode {
  const marks = normalizeTextMarks(node.marks);

  return marks === undefined
    ? { text: node.text, type: "text" }
    : { marks, text: node.text, type: "text" };
}

export function mergeAdjacentTextNodes(nodes: readonly TextNode[]): TextNode[] {
  return nodes.reduce<TextNode[]>((result, node) => {
    const normalizedNode = createNormalizedTextNode(node);
    const previousNode = result[result.length - 1];

    if (previousNode && areTextMarksEqual(previousNode.marks, normalizedNode.marks)) {
      result[result.length - 1] = {
        ...previousNode,
        text: previousNode.text + normalizedNode.text,
      };
      return result;
    }

    result.push(normalizedNode);
    return result;
  }, []);
}

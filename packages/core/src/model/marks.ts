import {
  TEXT_MARK_TYPES,
  type TextMarkAttributes,
  type TextMarkAttributeType,
  type TextMarks,
  type TextMarkType,
  type TextNode,
} from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isValidTextMarkAttributeValue<TAttribute extends TextMarkAttributeType>(
  attribute: TAttribute,
  value: unknown,
): value is TextMarkAttributes[TAttribute] {
  switch (attribute) {
    case "fontSize":
      return typeof value === "number" && Number.isFinite(value) && value > 0;
    case "textColor":
    case "backgroundColor":
      return typeof value === "string" && value.trim().length > 0;
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

export function areTextMarksEqual(
  left: TextMarks | undefined,
  right: TextMarks | undefined,
): boolean {
  return TEXT_MARK_TYPES.every(
    (mark) => hasTextMark(left, mark) === hasTextMark(right, mark),
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

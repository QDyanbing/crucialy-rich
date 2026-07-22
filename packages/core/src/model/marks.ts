import { TEXT_MARK_TYPES, type TextMarks, type TextMarkType } from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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

export function areTextMarksEqual(
  left: TextMarks | undefined,
  right: TextMarks | undefined,
): boolean {
  return TEXT_MARK_TYPES.every(
    (mark) => hasTextMark(left, mark) === hasTextMark(right, mark),
  );
}

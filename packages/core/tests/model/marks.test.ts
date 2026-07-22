import { describe, expect, it } from "vitest";

import {
  addTextMark,
  areTextMarksEqual,
  hasTextMark,
  normalizeTextMarks,
  removeTextMark,
  toggleTextMark,
} from "../../src/model";

describe("text mark helpers", () => {
  it("normalizes known true marks", () => {
    expect(
      normalizeTextMarks({
        bold: true,
        italic: false,
        underline: true,
      }),
    ).toEqual({ bold: true });
  });

  it("adds, removes and toggles marks", () => {
    const bold = addTextMark(undefined, "bold");
    const boldItalic = toggleTextMark(bold, "italic");
    const italic = removeTextMark(boldItalic, "bold");

    expect(bold).toEqual({ bold: true });
    expect(boldItalic).toEqual({ bold: true, italic: true });
    expect(italic).toEqual({ italic: true });
    expect(toggleTextMark(italic, "italic")).toBeUndefined();
  });

  it("checks and compares active marks", () => {
    expect(hasTextMark({ bold: true }, "bold")).toBe(true);
    expect(hasTextMark({ bold: true }, "italic")).toBe(false);
    expect(areTextMarksEqual({ bold: true }, { bold: true })).toBe(true);
    expect(areTextMarksEqual({ bold: true }, { italic: true })).toBe(false);
    expect(areTextMarksEqual(undefined, {})).toBe(true);
  });
});

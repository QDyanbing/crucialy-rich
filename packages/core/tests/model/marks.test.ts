import { describe, expect, it } from "vitest";

import {
  addTextMark,
  areTextMarksEqual,
  getTextMarkAttribute,
  hasTextMark,
  isValidFontSize,
  isValidTextMarkAttributeValue,
  MAX_FONT_SIZE,
  mergeAdjacentTextNodes,
  normalizeTextMarks,
  removeTextMarkAttribute,
  removeTextMark,
  setTextMarkAttribute,
  setTextMark,
  toggleTextMark,
  MIN_FONT_SIZE,
  type TextNode,
} from "../../src/model";

describe("text mark helpers", () => {
  it("normalizes known true marks", () => {
    expect(
      normalizeTextMarks({
        bold: true,
        italic: false,
        strike: true,
        underline: true,
        highlight: true,
      }),
    ).toEqual({ bold: true, strike: true, underline: true });
  });

  it("normalizes valid attribute marks with boolean marks", () => {
    expect(
      normalizeTextMarks({
        backgroundColor: "#fff4cc",
        bold: true,
        fontSize: 16,
        textColor: "#1c2520",
      }),
    ).toEqual({
      backgroundColor: "#fff4cc",
      bold: true,
      fontSize: 16,
      textColor: "#1c2520",
    });
  });

  it("drops invalid attribute mark values", () => {
    expect(
      normalizeTextMarks({
        backgroundColor: "",
        fontSize: Number.POSITIVE_INFINITY,
        textColor: 123,
      }),
    ).toBeUndefined();
    expect(isValidTextMarkAttributeValue("fontSize", 0)).toBe(false);
    expect(isValidTextMarkAttributeValue("fontSize", 14)).toBe(true);
    expect(isValidTextMarkAttributeValue("textColor", "  ")).toBe(false);
    expect(isValidTextMarkAttributeValue("backgroundColor", "#fff")).toBe(true);
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

  it("sets marks to an explicit active state", () => {
    expect(setTextMark({ italic: true }, "bold", true)).toEqual({
      bold: true,
      italic: true,
    });
    expect(setTextMark({ bold: true, italic: true }, "bold", false)).toEqual({
      italic: true,
    });
    expect(setTextMark({ bold: true }, "bold", false)).toBeUndefined();
  });

  it("keeps four boolean marks active together", () => {
    const marks = normalizeTextMarks({
      bold: true,
      italic: true,
      strike: true,
      underline: true,
    });

    expect(marks).toEqual({
      bold: true,
      italic: true,
      strike: true,
      underline: true,
    });
    expect(removeTextMark(marks, "underline")).toEqual({
      bold: true,
      italic: true,
      strike: true,
    });
    expect(setTextMark(marks, "strike", false)).toEqual({
      bold: true,
      italic: true,
      underline: true,
    });
  });

  it("gets, sets and removes attribute marks independently", () => {
    const sized = setTextMarkAttribute({ bold: true }, "fontSize", 16);
    const colored = setTextMarkAttribute(sized, "textColor", "#1c2520");
    const highlighted = setTextMarkAttribute(colored, "backgroundColor", "#fff4cc");

    expect(highlighted).toEqual({
      backgroundColor: "#fff4cc",
      bold: true,
      fontSize: 16,
      textColor: "#1c2520",
    });
    expect(getTextMarkAttribute(highlighted, "fontSize")).toBe(16);
    expect(getTextMarkAttribute(highlighted, "textColor")).toBe("#1c2520");
    expect(removeTextMarkAttribute(highlighted, "textColor")).toEqual({
      backgroundColor: "#fff4cc",
      bold: true,
      fontSize: 16,
    });
  });

  it("checks and compares active marks", () => {
    expect(hasTextMark({ bold: true }, "bold")).toBe(true);
    expect(hasTextMark({ bold: true }, "italic")).toBe(false);
    expect(areTextMarksEqual({ bold: true }, { bold: true })).toBe(true);
    expect(areTextMarksEqual({ bold: true }, { italic: true })).toBe(false);
    expect(areTextMarksEqual(undefined, {})).toBe(true);
  });

  it("merges adjacent text nodes with equal marks", () => {
    expect(
      mergeAdjacentTextNodes([
        { type: "text", text: "你" },
        { type: "text", text: "好" },
        { type: "text", text: "世", marks: { bold: true } },
        { type: "text", text: "界", marks: { bold: true } },
        { type: "text", text: "。", marks: { italic: true } },
      ]),
    ).toEqual([
      { type: "text", text: "你好" },
      { type: "text", text: "世界", marks: { bold: true } },
      { type: "text", text: "。", marks: { italic: true } },
    ]);
  });

  it("merges text only when attribute marks are equal", () => {
    const sharedMarks = {
      bold: true as const,
      fontSize: 16,
      textColor: "#1c2520",
    };

    expect(areTextMarksEqual(sharedMarks, { ...sharedMarks })).toBe(true);
    expect(areTextMarksEqual(sharedMarks, { ...sharedMarks, fontSize: 18 })).toBe(
      false,
    );
    expect(
      mergeAdjacentTextNodes([
        { type: "text", text: "属", marks: sharedMarks },
        { type: "text", text: "性", marks: { ...sharedMarks } },
        { type: "text", text: "标", marks: { ...sharedMarks, fontSize: 18 } },
        { type: "text", text: "记", marks: { ...sharedMarks, fontSize: 18 } },
      ]),
    ).toEqual([
      { type: "text", text: "属性", marks: sharedMarks },
      {
        type: "text",
        text: "标记",
        marks: { ...sharedMarks, fontSize: 18 },
      },
    ]);
  });

  it("normalizes marks while merging text nodes", () => {
    const original: TextNode = {
      type: "text",
      text: "你",
      marks: { bold: true },
    };
    const noisyNode = {
      type: "text",
      text: "好",
      marks: { bold: true, highlight: true },
    } as unknown as TextNode;
    const result = mergeAdjacentTextNodes([original, noisyNode]);

    expect(result).toEqual([{ type: "text", text: "你好", marks: { bold: true } }]);
    expect(result[0]).not.toBe(original);
  });
});

describe("font size constraints", () => {
  it("accepts the supported range boundaries", () => {
    expect(isValidFontSize(MIN_FONT_SIZE)).toBe(true);
    expect(isValidFontSize(MAX_FONT_SIZE)).toBe(true);
  });

  it("rejects out of range and fractional values", () => {
    expect(isValidFontSize(MIN_FONT_SIZE - 1)).toBe(false);
    expect(isValidFontSize(MAX_FONT_SIZE + 1)).toBe(false);
    expect(isValidFontSize(16.5)).toBe(false);
    expect(isValidFontSize(Number.NaN)).toBe(false);
  });

  it("drops unsupported font sizes during normalization", () => {
    expect(normalizeTextMarks({ bold: true, fontSize: 7 })).toEqual({
      bold: true,
    });
    expect(normalizeTextMarks({ fontSize: 73 })).toBeUndefined();
  });
});

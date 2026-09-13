import { describe, expect, it } from "vitest";

import {
  cloneBlockSelection,
  createBlockSelection,
  createDocument,
  createImage,
  createParagraph,
  createText,
  isImageBlockSelection,
  isValidBlockSelection,
} from "../../src";

const document = createDocument([
  createParagraph([createText("正文")]),
  createImage("https://example.com/cover.png"),
]);

describe("block selection", () => {
  it("creates and clones detached block paths", () => {
    const path = [1];
    const selection = createBlockSelection(path);
    const cloned = cloneBlockSelection(selection);

    path[0] = 8;
    selection.path[0] = 9;

    expect(cloned).toEqual({ path: [1], type: "block" });
    expect(cloned.path).not.toBe(selection.path);
  });

  it("validates top-level block selections", () => {
    expect(isValidBlockSelection(document, createBlockSelection([0]))).toBe(true);
    expect(isValidBlockSelection(document, createBlockSelection([1]))).toBe(true);
    expect(isValidBlockSelection(document, createBlockSelection([0, 0]))).toBe(false);
    expect(isValidBlockSelection(document, createBlockSelection([8]))).toBe(false);
  });

  it("recognizes only selected image blocks", () => {
    expect(isImageBlockSelection(document, createBlockSelection([1]))).toBe(true);
    expect(isImageBlockSelection(document, createBlockSelection([0]))).toBe(false);
  });
});

import { describe, expect, it } from "vitest";

import { createDocument, createParagraph, createText } from "../../src/model";
import { applyDeleteText, createDeleteTextOperation } from "../../src/operation";

describe("createDeleteTextOperation", () => {
  it("creates a delete text operation from a range", () => {
    expect(
      createDeleteTextOperation({
        anchor: {
          path: [0, 0],
          offset: 1,
        },
        focus: {
          path: [0, 0],
          offset: 3,
        },
      }),
    ).toEqual({
      range: {
        anchor: {
          path: [0, 0],
          offset: 1,
        },
        focus: {
          path: [0, 0],
          offset: 3,
        },
      },
      type: "delete_text",
    });
  });

  it("clones range paths when creating the operation", () => {
    const anchorPath = [0, 0];
    const focusPath = [0, 0];
    const operation = createDeleteTextOperation({
      anchor: { path: anchorPath, offset: 1 },
      focus: { path: focusPath, offset: 3 },
    });

    anchorPath[0] = 9;
    focusPath[1] = 8;

    expect(operation.range.anchor.path).toEqual([0, 0]);
    expect(operation.range.focus.path).toEqual([0, 0]);
  });
});

describe("applyDeleteText", () => {
  it("deletes text from the start of a text node", () => {
    const document = createDocument([createParagraph([createText("你好世界")])]);
    const result = applyDeleteText(
      document,
      createDeleteTextOperation({
        anchor: {
          path: [0, 0],
          offset: 0,
        },
        focus: {
          path: [0, 0],
          offset: 2,
        },
      }),
    );

    expect(result.children[0]?.children[0]?.text).toBe("世界");
    expect(document.children[0]?.children[0]?.text).toBe("你好世界");
  });
});

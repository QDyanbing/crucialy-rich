import { describe, expect, it } from "vitest";

import { createDocument, createParagraph, createText } from "../../src/model";
import {
  applyDeleteText,
  createDeleteTextOperation,
  createSelectionAfterDeleteText,
} from "../../src/operation";

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

  it("deletes text in the middle of a text node", () => {
    const document = createDocument([createParagraph([createText("你好，美丽世界")])]);
    const result = applyDeleteText(
      document,
      createDeleteTextOperation({
        anchor: {
          path: [0, 0],
          offset: 3,
        },
        focus: {
          path: [0, 0],
          offset: 5,
        },
      }),
    );

    expect(result.children[0]?.children[0]?.text).toBe("你好，世界");
  });

  it("deletes text at the end of a text node", () => {
    const document = createDocument([createParagraph([createText("你好世界尾巴")])]);
    const result = applyDeleteText(
      document,
      createDeleteTextOperation({
        anchor: {
          path: [0, 0],
          offset: 4,
        },
        focus: {
          path: [0, 0],
          offset: 6,
        },
      }),
    );

    expect(result.children[0]?.children[0]?.text).toBe("你好世界");
  });

  it("supports backward ranges inside one text node", () => {
    const document = createDocument([createParagraph([createText("你好，世界")])]);
    const result = applyDeleteText(
      document,
      createDeleteTextOperation({
        anchor: {
          path: [0, 0],
          offset: 5,
        },
        focus: {
          path: [0, 0],
          offset: 3,
        },
      }),
    );

    expect(result.children[0]?.children[0]?.text).toBe("你好，");
  });

  it("preserves marks on the edited text node", () => {
    const document = createDocument([
      createParagraph([createText("你好世界", { italic: true })]),
    ]);
    const result = applyDeleteText(
      document,
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
    );

    expect(result.children[0]?.children[0]).toEqual({
      type: "text",
      text: "你界",
      marks: { italic: true },
    });
  });

  it("throws when a range point does not reference text", () => {
    const document = createDocument([createParagraph([createText("你好")])]);

    expect(() =>
      applyDeleteText(
        document,
        createDeleteTextOperation({
          anchor: {
            path: [0],
            offset: 0,
          },
          focus: {
            path: [0, 0],
            offset: 1,
          },
        }),
      ),
    ).toThrow("delete text range must reference text nodes");
  });

  it("throws when a range offset is outside text", () => {
    const document = createDocument([createParagraph([createText("你好")])]);

    expect(() =>
      applyDeleteText(
        document,
        createDeleteTextOperation({
          anchor: {
            path: [0, 0],
            offset: 0,
          },
          focus: {
            path: [0, 0],
            offset: 3,
          },
        }),
      ),
    ).toThrow("delete text range must reference text nodes");
  });

  it("throws when a range crosses text nodes", () => {
    const document = createDocument([
      createParagraph([createText("你好"), createText("世界")]),
    ]);

    expect(() =>
      applyDeleteText(
        document,
        createDeleteTextOperation({
          anchor: {
            path: [0, 0],
            offset: 1,
          },
          focus: {
            path: [0, 1],
            offset: 1,
          },
        }),
      ),
    ).toThrow("delete text range must stay inside one text node");
  });

  it("keeps the same document reference when the range is collapsed", () => {
    const document = createDocument([createParagraph([createText("你好")])]);
    const result = applyDeleteText(
      document,
      createDeleteTextOperation({
        anchor: {
          path: [0, 0],
          offset: 1,
        },
        focus: {
          path: [0, 0],
          offset: 1,
        },
      }),
    );

    expect(result).toBe(document);
  });
});

describe("createSelectionAfterDeleteText", () => {
  it("creates a collapsed selection at the start of the deleted range", () => {
    const operation = createDeleteTextOperation({
      anchor: {
        path: [0, 0],
        offset: 1,
      },
      focus: {
        path: [0, 0],
        offset: 3,
      },
    });

    expect(createSelectionAfterDeleteText(operation)).toEqual({
      anchor: {
        path: [0, 0],
        offset: 1,
      },
      focus: {
        path: [0, 0],
        offset: 1,
      },
    });
  });

  it("uses the normalized start for a backward deleted range", () => {
    const operation = createDeleteTextOperation({
      anchor: {
        path: [0, 0],
        offset: 5,
      },
      focus: {
        path: [0, 0],
        offset: 2,
      },
    });

    expect(createSelectionAfterDeleteText(operation)).toEqual({
      anchor: {
        path: [0, 0],
        offset: 2,
      },
      focus: {
        path: [0, 0],
        offset: 2,
      },
    });
  });
});

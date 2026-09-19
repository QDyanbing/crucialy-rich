import { describe, expect, it } from "vitest";

import {
  createBulletList,
  createDocument,
  createListItem,
  createParagraph,
  createText,
  createTable,
} from "../../src/model";
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
  it("deletes text inside a table cell paragraph", () => {
    const table = createTable(1, 1);
    table.children[0]!.children[0]!.children[0]!.children[0]!.text = "单元格";
    const document = createDocument([table]);
    const result = applyDeleteText(
      document,
      createDeleteTextOperation({
        anchor: { offset: 1, path: [0, 0, 0, 0, 0] },
        focus: { offset: 2, path: [0, 0, 0, 0, 0] },
      }),
    );
    const resultTable = result.children[0];

    expect(
      resultTable?.type === "table"
        ? resultTable.children[0]?.children[0]?.children[0]?.children[0]?.text
        : undefined,
    ).toBe("单格");
  });

  it("deletes text inside a list item", () => {
    const document = createDocument([
      createBulletList([createListItem([createText("项目一")])]),
    ]);
    const operation = createDeleteTextOperation({
      anchor: { offset: 2, path: [0, 0, 0] },
      focus: { offset: 3, path: [0, 0, 0] },
    });

    expect(applyDeleteText(document, operation)).toEqual(
      createDocument([createBulletList([createListItem([createText("项目")])])]),
    );
  });

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

  it("deletes across text nodes in one paragraph and preserves edge marks", () => {
    const document = createDocument([
      createParagraph([
        createText("你好", { bold: true }),
        createText("世界", { italic: true }),
      ]),
    ]);

    expect(
      applyDeleteText(
        document,
        createDeleteTextOperation({
          anchor: { path: [0, 0], offset: 1 },
          focus: { path: [0, 1], offset: 1 },
        }),
      ),
    ).toEqual(
      createDocument([
        createParagraph([
          createText("你", { bold: true }),
          createText("界", { italic: true }),
        ]),
      ]),
    );
  });

  it("leaves one empty text node after deleting a whole marked range", () => {
    const document = createDocument([
      createParagraph([
        createText("/", { bold: true }),
        createText("he", { italic: true }),
      ]),
    ]);

    expect(
      applyDeleteText(
        document,
        createDeleteTextOperation({
          anchor: { path: [0, 0], offset: 0 },
          focus: { path: [0, 1], offset: 2 },
        }),
      ).children[0],
    ).toEqual(createParagraph([createText("", { bold: true })]));
  });

  it("rejects a range that crosses text containers", () => {
    const document = createDocument([
      createParagraph([createText("第一段")]),
      createParagraph([createText("第二段")]),
    ]);

    expect(() =>
      applyDeleteText(
        document,
        createDeleteTextOperation({
          anchor: { path: [0, 0], offset: 1 },
          focus: { path: [1, 0], offset: 1 },
        }),
      ),
    ).toThrow("delete text range must stay inside one text container");
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
  const document = createDocument([createParagraph([createText("abcdef")])]);

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

    expect(createSelectionAfterDeleteText(document, operation)).toEqual({
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

    expect(createSelectionAfterDeleteText(document, operation)).toEqual({
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

  it("remaps a start point when deleting across text nodes", () => {
    const splitDocument = createDocument([
      createParagraph([createText("ab"), createText("cd"), createText("ef")]),
    ]);
    const operation = createDeleteTextOperation({
      anchor: { offset: 1, path: [0, 1] },
      focus: { offset: 1, path: [0, 2] },
    });

    expect(createSelectionAfterDeleteText(splitDocument, operation)).toEqual({
      anchor: { offset: 1, path: [0, 1] },
      focus: { offset: 1, path: [0, 1] },
    });
  });
});

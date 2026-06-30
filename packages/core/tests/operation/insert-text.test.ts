import { describe, expect, it } from "vitest";

import { createDocument, createParagraph, createText } from "../../src/model";
import { applyInsertText, createInsertTextOperation } from "../../src/operation";

describe("createInsertTextOperation", () => {
  it("creates an insert text operation from a point and text", () => {
    expect(
      createInsertTextOperation(
        {
          path: [0, 0],
          offset: 2,
        },
        "你好",
      ),
    ).toEqual({
      point: {
        path: [0, 0],
        offset: 2,
      },
      text: "你好",
      type: "insert_text",
    });
  });

  it("clones the point path when creating the operation", () => {
    const path = [0, 0];
    const operation = createInsertTextOperation({ path, offset: 1 }, "x");

    path[0] = 9;

    expect(operation.point.path).toEqual([0, 0]);
  });
});

describe("applyInsertText", () => {
  it("inserts text at the start of a text node", () => {
    const document = createDocument([createParagraph([createText("世界")])]);
    const result = applyInsertText(
      document,
      createInsertTextOperation(
        {
          path: [0, 0],
          offset: 0,
        },
        "你好，",
      ),
    );

    expect(result.children[0]?.children[0]?.text).toBe("你好，世界");
    expect(document.children[0]?.children[0]?.text).toBe("世界");
  });

  it("inserts text in the middle of a text node", () => {
    const document = createDocument([createParagraph([createText("你好世界")])]);
    const result = applyInsertText(
      document,
      createInsertTextOperation(
        {
          path: [0, 0],
          offset: 2,
        },
        "，",
      ),
    );

    expect(result.children[0]?.children[0]?.text).toBe("你好，世界");
  });

  it("inserts text at the end of a text node", () => {
    const document = createDocument([createParagraph([createText("你好")])]);
    const result = applyInsertText(
      document,
      createInsertTextOperation(
        {
          path: [0, 0],
          offset: 2,
        },
        "，crucialy-rich。",
      ),
    );

    expect(result.children[0]?.children[0]?.text).toBe("你好，crucialy-rich。");
  });

  it("throws when the point path does not reference text", () => {
    const document = createDocument([createParagraph([createText("你好")])]);

    expect(() =>
      applyInsertText(
        document,
        createInsertTextOperation(
          {
            path: [0],
            offset: 0,
          },
          "x",
        ),
      ),
    ).toThrow(RangeError);
  });

  it("throws when the point offset is outside text", () => {
    const document = createDocument([createParagraph([createText("你好")])]);

    expect(() =>
      applyInsertText(
        document,
        createInsertTextOperation(
          {
            path: [0, 0],
            offset: 3,
          },
          "x",
        ),
      ),
    ).toThrow("insert text point must reference a text node");
  });
});

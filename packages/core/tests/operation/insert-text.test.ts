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
});

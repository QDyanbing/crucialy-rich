import { describe, expect, it } from "vitest";

import { createInsertTextOperation } from "../../src/operation";

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

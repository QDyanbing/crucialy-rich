import { describe, expect, it } from "vitest";

import { createSplitBlockOperation } from "../../src/operation";

describe("createSplitBlockOperation", () => {
  it("creates a split block operation from a point", () => {
    expect(
      createSplitBlockOperation({
        path: [0, 0],
        offset: 2,
      }),
    ).toEqual({
      point: {
        path: [0, 0],
        offset: 2,
      },
      type: "split_block",
    });
  });

  it("clones the point path when creating the operation", () => {
    const path = [0, 0];
    const operation = createSplitBlockOperation({ path, offset: 1 });

    path[0] = 9;

    expect(operation.point.path).toEqual([0, 0]);
  });
});

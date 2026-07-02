import { describe, expect, it } from "vitest";

import { createMergeBlockOperation } from "../../src/operation";

describe("createMergeBlockOperation", () => {
  it("creates a merge block operation from a point", () => {
    expect(
      createMergeBlockOperation({
        path: [1, 0],
        offset: 0,
      }),
    ).toEqual({
      point: {
        path: [1, 0],
        offset: 0,
      },
      type: "merge_block",
    });
  });

  it("clones the point path when creating the operation", () => {
    const path = [1, 0];
    const operation = createMergeBlockOperation({ path, offset: 0 });

    path[0] = 9;

    expect(operation.point.path).toEqual([1, 0]);
  });
});

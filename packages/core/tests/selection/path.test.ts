import { describe, expect, it } from "vitest";

import { createDocument, createParagraph, createText } from "../../src/model";
import { getNodeAtPath, hasNodeAtPath } from "../../src/selection/path";

const document = createDocument([
  createParagraph([createText("alpha"), createText("beta")]),
  createParagraph([createText("gamma")]),
]);

describe("selection path lookup", () => {
  it("returns the document for the root path", () => {
    expect(getNodeAtPath(document, [])).toBe(document);
  });

  it("returns block nodes by block path", () => {
    const node = getNodeAtPath(document, [1]);
    expect(node?.type).toBe("paragraph");
  });

  it("returns text nodes by leaf path", () => {
    const node = getNodeAtPath(document, [0, 1]);
    expect(node).toEqual({ type: "text", text: "beta" });
  });

  it("reports whether a node exists", () => {
    expect(hasNodeAtPath(document, [0, 0])).toBe(true);
    expect(hasNodeAtPath(document, [2])).toBe(false);
  });

  it("rejects out-of-range, negative, non-integer, and too-deep paths", () => {
    expect(getNodeAtPath(document, [0, 9])).toBeUndefined();
    expect(getNodeAtPath(document, [-1])).toBeUndefined();
    expect(getNodeAtPath(document, [0.5])).toBeUndefined();
    expect(getNodeAtPath(document, [0, 0, 0])).toBeUndefined();
  });
});

import { describe, expect, it } from "vitest";

import {
  createDivider,
  createDocument,
  createParagraph,
  createText,
} from "../../src/model";
import { getNodeAtPath, hasNodeAtPath } from "../../src/selection/path";

const document = createDocument([
  createParagraph([createText("alpha"), createText("beta")]),
  createDivider(),
  createParagraph([createText("gamma")]),
]);

describe("selection path lookup", () => {
  it("returns the document for the root path", () => {
    expect(getNodeAtPath(document, [])).toBe(document);
  });

  it("returns block nodes by block path", () => {
    const node = getNodeAtPath(document, [2]);
    expect(node?.type).toBe("paragraph");
  });

  it("returns void blocks but no text path below them", () => {
    expect(getNodeAtPath(document, [1])).toEqual({ children: [], type: "divider" });
    expect(getNodeAtPath(document, [1, 0])).toBeUndefined();
  });

  it("returns text nodes by leaf path", () => {
    const node = getNodeAtPath(document, [0, 1]);
    expect(node).toEqual({ type: "text", text: "beta" });
  });

  it("reports whether a node exists", () => {
    expect(hasNodeAtPath(document, [0, 0])).toBe(true);
    expect(hasNodeAtPath(document, [3])).toBe(false);
  });

  it("rejects out-of-range, negative, non-integer, and too-deep paths", () => {
    expect(getNodeAtPath(document, [0, 9])).toBeUndefined();
    expect(getNodeAtPath(document, [-1])).toBeUndefined();
    expect(getNodeAtPath(document, [0.5])).toBeUndefined();
    expect(getNodeAtPath(document, [0, 0, 0])).toBeUndefined();
  });
});

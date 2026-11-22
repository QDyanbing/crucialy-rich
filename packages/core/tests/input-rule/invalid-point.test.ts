import { describe, expect, it } from "vitest";
import {
  createDocument,
  createParagraph,
  createText,
  createMarkdownInputRuleResult,
  type Point,
} from "../../src";
describe("input rule point validation", () => {
  it.each([
    { path: [0, 0], offset: 99 },
    { path: [0, 0], offset: -1 },
    { path: [0, 0], offset: 0.5 },
    { path: ["0", "0"], offset: 1 },
    { path: [0, 0, 0], offset: 1 },
  ])("rejects malformed points", (point) => {
    expect(
      createMarkdownInputRuleResult({
        data: " ",
        document: createDocument([createParagraph([createText("-")])]),
        selection: { anchor: point as Point, focus: point as Point },
      }),
    ).toBeUndefined();
  });
});

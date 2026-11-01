// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import {
  createDocument,
  createParagraph,
  createText,
  domPointToModelPoint,
} from "../../src";

const model = createDocument([createParagraph([createText("甲😀乙")])]);

function leaf(tag = "span", text = "甲😀乙") {
  const element = document.createElement(tag);
  element.setAttribute("data-crucialy-path", "[0,0]");
  element.textContent = text;
  return element;
}

describe("DOM text leaf element offsets", () => {
  it.each(["span", "strong", "em", "a", "code"])(
    "uses child boundaries rather than character offsets for %s",
    (tag) => {
      const element = leaf(tag);
      expect(domPointToModelPoint(model, { node: element, offset: 0 })).toEqual({
        path: [0, 0],
        offset: 0,
      });
      expect(domPointToModelPoint(model, { node: element, offset: 1 })).toEqual({
        path: [0, 0],
        offset: 4,
      });
    },
  );

  it.each([-1, 2, 0.5, NaN, Infinity])(
    "refuses invalid element child offset %s",
    (offset) => {
      expect(domPointToModelPoint(model, { node: leaf(), offset })).toBeUndefined();
    },
  );

  it("keeps an empty leaf at zero without inventing a text node", () => {
    const empty = createDocument([createParagraph([createText("")])]);
    expect(domPointToModelPoint(empty, { node: leaf("span", ""), offset: 0 })).toEqual({
      path: [0, 0],
      offset: 0,
    });
  });
});

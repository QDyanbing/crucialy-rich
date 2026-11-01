// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import {
  createDocument,
  createParagraph,
  createText,
  domPointToModelPoint,
  modelPointToDomPoint,
} from "../../src";

const value = "甲😀乙";
const model = createDocument([createParagraph([createText(value)])]);

function splitLeaf(offset: number) {
  const element = document.createElement("span");
  element.setAttribute("data-crucialy-path", "[0,0]");
  const first = document.createTextNode(value);
  element.append(first);
  const second = first.splitText(offset);
  return { element, first, second };
}

describe("split DOM text node mapping", () => {
  it.each([0, 1, 2, 3, 4])(
    "restores every model offset after a split at %s",
    (split) => {
      const { element } = splitLeaf(split);
      for (let offset = 0; offset <= value.length; offset++) {
        const point = { path: [0, 0], offset };
        const dom = modelPointToDomPoint(element, model, point)!;
        expect(dom).toBeDefined();
        expect(dom.offset).toBeLessThanOrEqual((dom.node as Text).length);
        expect(domPointToModelPoint(model, dom)).toEqual(point);
      }
    },
  );

  it("does not clamp a model point to the end of a shortened DOM leaf", () => {
    const { element, first } = splitLeaf(1);
    element.replaceChildren(first);
    expect(
      modelPointToDomPoint(element, model, { path: [0, 0], offset: 3 }),
    ).toBeUndefined();
  });
  it.each([0, 1, 2, 3, 4])(
    "accumulates UTF-16 offsets after a split at %s",
    (split) => {
      const { element, first, second } = splitLeaf(split);
      expect(domPointToModelPoint(model, { node: first, offset: split })).toEqual({
        path: [0, 0],
        offset: split,
      });
      expect(domPointToModelPoint(model, { node: second, offset: 0 })).toEqual({
        path: [0, 0],
        offset: split,
      });
      expect(
        domPointToModelPoint(model, { node: second, offset: second.length }),
      ).toEqual({ path: [0, 0], offset: 4 });
      expect(domPointToModelPoint(model, { node: element, offset: 1 })).toEqual({
        path: [0, 0],
        offset: split,
      });
      expect(domPointToModelPoint(model, { node: element, offset: 2 })).toEqual({
        path: [0, 0],
        offset: 4,
      });
    },
  );

  it("rejects a local text offset outside the actual DOM node", () => {
    const { first } = splitLeaf(1);
    expect(domPointToModelPoint(model, { node: first, offset: 2 })).toBeUndefined();
  });

  it("does not read through an unmodeled nested wrapper", () => {
    const { element } = splitLeaf(1);
    const wrapper = document.createElement("strong");
    wrapper.textContent = "甲";
    element.replaceChildren(wrapper);
    expect(
      domPointToModelPoint(model, { node: wrapper.firstChild!, offset: 0 }),
    ).toBeUndefined();
    expect(domPointToModelPoint(model, { node: element, offset: 1 })).toBeUndefined();
  });
});

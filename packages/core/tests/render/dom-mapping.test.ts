/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it } from "vitest";

import { createDocument, createParagraph, createText } from "../../src/model";
import {
  domPointToModelPoint,
  findClosestModelPathElement,
  findElementByModelPath,
  getElementModelPath,
} from "../../src/render";

describe("dom model path helpers", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div data-crucialy-path="[]">
        <p data-crucialy-path="[0]">
          <span data-crucialy-path="[0,0]">Hello</span>
        </p>
      </div>
    `;
  });

  it("reads model paths from elements", () => {
    const paragraph = document.querySelector("p");

    expect(paragraph).not.toBeNull();
    expect(getElementModelPath(paragraph!)).toEqual([0]);
  });

  it("finds the closest model path element from a text node", () => {
    const text = document.querySelector("span")?.firstChild;

    expect(text).toBeDefined();
    expect(findClosestModelPathElement(text!)).toBe(document.querySelector("span"));
  });

  it("finds an element by model path", () => {
    const root = document.body;

    expect(findElementByModelPath(root, [0, 0])).toBe(document.querySelector("span"));
    expect(findElementByModelPath(root, [9])).toBeUndefined();
  });

  it("maps a text dom point to a model point", () => {
    const model = createDocument([createParagraph([createText("Hello")])]);
    const text = document.querySelector("span")?.firstChild;

    expect(text).toBeDefined();
    expect(domPointToModelPoint(model, { node: text!, offset: 2 })).toEqual({
      path: [0, 0],
      offset: 2,
    });
  });

  it("maps an empty text element to offset zero", () => {
    const model = createDocument([createParagraph([createText("")])]);
    document.body.innerHTML = `
      <div data-crucialy-path="[]">
        <p data-crucialy-path="[0]">
          <span data-crucialy-path="[0,0]"></span>
        </p>
      </div>
    `;
    const span = document.querySelector("span");

    expect(span).not.toBeNull();
    expect(domPointToModelPoint(model, { node: span!, offset: 0 })).toEqual({
      path: [0, 0],
      offset: 0,
    });
  });

  it("maps paragraph dom boundaries to model points", () => {
    const model = createDocument([
      createParagraph([createText("Hello"), createText(" world")]),
    ]);
    document.body.innerHTML = `
      <div data-crucialy-path="[]">
        <p data-crucialy-path="[0]">
          <span data-crucialy-path="[0,0]">Hello</span>
          <span data-crucialy-path="[0,1]"> world</span>
        </p>
      </div>
    `;
    const paragraph = document.querySelector("p");

    expect(paragraph).not.toBeNull();
    expect(domPointToModelPoint(model, { node: paragraph!, offset: 0 })).toEqual({
      path: [0, 0],
      offset: 0,
    });
    expect(domPointToModelPoint(model, { node: paragraph!, offset: 1 })).toEqual({
      path: [0, 1],
      offset: 0,
    });
    expect(domPointToModelPoint(model, { node: paragraph!, offset: 2 })).toEqual({
      path: [0, 1],
      offset: 6,
    });
  });
});

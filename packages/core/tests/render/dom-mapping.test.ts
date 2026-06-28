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
  modelPointToDomPoint,
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

  it("returns undefined when no closest model path element exists", () => {
    const text = document.createTextNode("Loose");

    expect(findClosestModelPathElement(text)).toBeUndefined();
  });

  it("finds an element by model path", () => {
    const root = document.body;

    expect(findElementByModelPath(root, [0, 0])).toBe(document.querySelector("span"));
    expect(findElementByModelPath(root, [9])).toBeUndefined();
  });

  it("finds the root element by an empty model path", () => {
    const root = document.querySelector("div");

    expect(root).not.toBeNull();
    expect(findElementByModelPath(root!, [])).toBe(root);
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

  it("returns undefined for invalid dom point offsets", () => {
    const model = createDocument([createParagraph([createText("Hello")])]);
    const text = document.querySelector("span")?.firstChild;

    expect(text).toBeDefined();
    expect(domPointToModelPoint(model, { node: text!, offset: -1 })).toBeUndefined();
  });

  it("returns undefined for dom nodes without model paths", () => {
    const model = createDocument([createParagraph([createText("Hello")])]);

    expect(
      domPointToModelPoint(model, {
        node: document.createTextNode("Loose"),
        offset: 0,
      }),
    ).toBeUndefined();
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

  it("maps a model point to a text dom point", () => {
    const model = createDocument([createParagraph([createText("Hello")])]);
    const result = modelPointToDomPoint(document.body, model, {
      path: [0, 0],
      offset: 3,
    });

    expect(result?.node).toBe(document.querySelector("span")?.firstChild);
    expect(result?.offset).toBe(3);
  });

  it("returns undefined for invalid model points", () => {
    const model = createDocument([createParagraph([createText("Hello")])]);

    expect(
      modelPointToDomPoint(document.body, model, {
        path: [0, 0],
        offset: 99,
      }),
    ).toBeUndefined();
  });

  it("maps an empty model text point to its element", () => {
    const model = createDocument([createParagraph([createText("")])]);
    document.body.innerHTML = `
      <div data-crucialy-path="[]">
        <p data-crucialy-path="[0]">
          <span data-crucialy-path="[0,0]"></span>
        </p>
      </div>
    `;
    const span = document.querySelector("span");
    const result = modelPointToDomPoint(document.body, model, {
      path: [0, 0],
      offset: 0,
    });

    expect(result).toEqual({
      node: span,
      offset: 0,
    });
  });
});

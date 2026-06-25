/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it } from "vitest";

import {
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
});

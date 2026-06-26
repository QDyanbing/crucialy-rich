/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it } from "vitest";

import { createDocument, createParagraph, createText } from "../../src/model";
import { domSelectionToModelSelection } from "../../src/render";

describe("domSelectionToModelSelection", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div data-crucialy-path="[]">
        <p data-crucialy-path="[0]">
          <span data-crucialy-path="[0,0]">Hello</span>
        </p>
      </div>
    `;
  });

  it("reads a collapsed browser selection as a model selection", () => {
    const model = createDocument([createParagraph([createText("Hello")])]);
    const text = document.querySelector("span")?.firstChild;
    const range = document.createRange();
    const selection = window.getSelection();

    expect(text).toBeDefined();
    expect(selection).not.toBeNull();

    range.setStart(text!, 2);
    range.collapse(true);
    selection!.removeAllRanges();
    selection!.addRange(range);

    expect(domSelectionToModelSelection(model, selection!)).toEqual({
      anchor: { path: [0, 0], offset: 2 },
      focus: { path: [0, 0], offset: 2 },
    });
  });

  it("returns undefined when there is no browser selection range", () => {
    const model = createDocument([createParagraph([createText("Hello")])]);
    const selection = window.getSelection();

    expect(selection).not.toBeNull();
    selection!.removeAllRanges();

    expect(domSelectionToModelSelection(model, selection!)).toBeUndefined();
  });
});

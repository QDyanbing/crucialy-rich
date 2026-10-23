/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it } from "vitest";

import { createDocument, createParagraph, createText } from "../../src/model";
import {
  applyModelSelectionToDom,
  createDomRangeFromModelSelection,
  domSelectionToModelSelection,
} from "../../src/render";

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

  it("creates a collapsed dom range from a model selection", () => {
    const model = createDocument([createParagraph([createText("Hello")])]);
    const text = document.querySelector("span")?.firstChild;
    const range = createDomRangeFromModelSelection(document.body, model, {
      anchor: { path: [0, 0], offset: 3 },
      focus: { path: [0, 0], offset: 3 },
    });

    expect(range).toBeDefined();
    expect(range?.startContainer).toBe(text);
    expect(range?.startOffset).toBe(3);
    expect(range?.collapsed).toBe(true);
  });

  it("applies a model selection to the browser selection", () => {
    const model = createDocument([createParagraph([createText("Hello")])]);
    const selection = window.getSelection();

    expect(selection).not.toBeNull();
    expect(
      applyModelSelectionToDom(document.body, model, {
        anchor: { path: [0, 0], offset: 4 },
        focus: { path: [0, 0], offset: 4 },
      }),
    ).toBe(true);
    expect(selection?.anchorNode).toBe(document.querySelector("span")?.firstChild);
    expect(selection?.anchorOffset).toBe(4);
  });

  it.each([
    [1, 4],
    [4, 1],
  ])("round trips the original selection direction (%s, %s)", (start, end) => {
    const model = createDocument([createParagraph([createText("Hello")])]);
    const selection = {
      anchor: { path: [0, 0], offset: start },
      focus: { path: [0, 0], offset: end },
    };
    expect(applyModelSelectionToDom(document.body, model, selection)).toBe(true);
    expect(domSelectionToModelSelection(model, window.getSelection()!)).toEqual(
      selection,
    );
  });

  it("keeps backward endpoints across blocks while DOM Range remains ordered", () => {
    document.body.insertAdjacentHTML(
      "beforeend",
      '<p data-crucialy-path="[1]"><span data-crucialy-path="[1,0]">World</span></p>',
    );
    const model = createDocument([
      createParagraph([createText("Hello")]),
      createParagraph([createText("World")]),
    ]);
    const selection = {
      anchor: { path: [1, 0], offset: 3 },
      focus: { path: [0, 0], offset: 1 },
    };
    expect(applyModelSelectionToDom(document.body, model, selection)).toBe(true);
    expect(domSelectionToModelSelection(model, window.getSelection()!)).toEqual(
      selection,
    );
    const range = createDomRangeFromModelSelection(document.body, model, selection)!;
    expect(range.startOffset).toBe(1);
    expect(range.endOffset).toBe(3);
  });

  it("leaves the current DOM selection intact when either point is invalid", () => {
    const model = createDocument([createParagraph([createText("Hello")])]);
    const valid = {
      anchor: { path: [0, 0], offset: 4 },
      focus: { path: [0, 0], offset: 1 },
    };
    applyModelSelectionToDom(document.body, model, valid);
    expect(
      applyModelSelectionToDom(document.body, model, {
        anchor: valid.anchor,
        focus: { path: [9, 0], offset: 0 },
      }),
    ).toBe(false);
    expect(domSelectionToModelSelection(model, window.getSelection()!)).toEqual(valid);
  });
});

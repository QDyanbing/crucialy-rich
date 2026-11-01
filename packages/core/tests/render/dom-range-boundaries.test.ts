// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import {
  applyModelSelectionToDom,
  createDocument,
  createDomRangeFromModelSelection,
  createParagraph,
  createText,
  domSelectionToModelSelection,
  renderDocument,
  renderNodeToHtml,
} from "../../src";

afterEach(() => {
  window.getSelection()!.removeAllRanges();
  document.body.replaceChildren();
});

function fixture() {
  const model = createDocument([
    createParagraph([
      createText("甲😀", { bold: true }),
      createText("乙后", { italic: true }),
    ]),
  ]);
  document.body.innerHTML = renderNodeToHtml(renderDocument(model));
  const first = document.querySelector("strong")!;
  const last = document.querySelector("em")!;
  const secondText = (first.firstChild as Text).splitText(1);
  return { model, first, last, secondText, selection: window.getSelection()! };
}

describe("DOM range boundary synchronization", () => {
  it.each([false, true])(
    "keeps element endpoint direction through model restoration (%s)",
    (backward) => {
      const { model, first, last, selection } = fixture();
      selection.setBaseAndExtent(
        backward ? last : first,
        backward ? 1 : 0,
        backward ? first : last,
        backward ? 0 : 1,
      );
      const start = { path: [0, 0], offset: 0 };
      const end = { path: [0, 1], offset: 2 };
      const expected = backward
        ? { anchor: end, focus: start }
        : { anchor: start, focus: end };
      expect(domSelectionToModelSelection(model, selection)).toEqual(expected);
      expect(applyModelSelectionToDom(document.body, model, expected)).toBe(true);
      expect(domSelectionToModelSelection(model, selection)).toEqual(expected);
      const range = createDomRangeFromModelSelection(document.body, model, expected)!;
      expect(range.toString()).toBe("甲😀乙后");
    },
  );

  it.each([false, true])(
    "preserves offsets across split nodes and different marks (%s)",
    (backward) => {
      const { model, last, secondText, selection } = fixture();
      const start = { path: [0, 0], offset: 3 };
      const end = { path: [0, 1], offset: 1 };
      selection.setBaseAndExtent(
        backward ? last.firstChild! : secondText,
        backward ? 1 : 2,
        backward ? secondText : last.firstChild!,
        backward ? 2 : 1,
      );
      const expected = backward
        ? { anchor: end, focus: start }
        : { anchor: start, focus: end };
      expect(domSelectionToModelSelection(model, selection)).toEqual(expected);
      expect(applyModelSelectionToDom(document.body, model, expected)).toBe(true);
      expect(domSelectionToModelSelection(model, selection)).toEqual(expected);
    },
  );

  it("keeps the current browser range when a rendered leaf is too short", () => {
    const { model, first, last, selection } = fixture();
    last.textContent = "乙";
    selection.setBaseAndExtent(first, 0, first, 0);
    const before = domSelectionToModelSelection(model, selection);
    expect(
      applyModelSelectionToDom(document.body, model, {
        anchor: { path: [0, 0], offset: 0 },
        focus: { path: [0, 1], offset: 2 },
      }),
    ).toBe(false);
    expect(domSelectionToModelSelection(model, selection)).toEqual(before);
  });

  it("restores an empty leaf without creating DOM text or a transaction", () => {
    const model = createDocument([createParagraph([createText("")])]);
    document.body.innerHTML = renderNodeToHtml(renderDocument(model));
    const point = { path: [0, 0], offset: 0 };
    const before = document.body.innerHTML;
    expect(
      applyModelSelectionToDom(document.body, model, { anchor: point, focus: point }),
    ).toBe(true);
    expect(domSelectionToModelSelection(model, window.getSelection()!)).toEqual({
      anchor: point,
      focus: point,
    });
    expect(document.body.innerHTML).toBe(before);
  });
});

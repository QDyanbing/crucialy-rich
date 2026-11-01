// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import {
  createDocument,
  createParagraph,
  createText,
  domPointToModelPoint,
  modelPointToDomPoint,
} from "../../src";

const model = createDocument([createParagraph([createText("甲乙")])]);
function paragraph(html: string) {
  const node = document.createElement("p");
  node.setAttribute("data-crucialy-path", "[0]");
  node.innerHTML = html;
  return node;
}

describe("DOM mapping safety boundaries", () => {
  it.each(["input", "img", "hr", "br"])(
    "does not interpret atomic %s as model text even with a matching path",
    (tag) => {
      const node = paragraph(`<${tag} data-crucialy-path="[0,0]">`);
      const child = node.firstElementChild!;
      expect(domPointToModelPoint(model, { node: child, offset: 0 })).toBeUndefined();
      expect(domPointToModelPoint(model, { node, offset: 0 })).toBeUndefined();
      expect(
        modelPointToDomPoint(node, model, { path: [0, 0], offset: 0 }),
      ).toBeUndefined();
    },
  );

  it.each([
    '<span data-crucialy-path="[1,0]">甲乙</span>',
    '<span data-crucialy-path="bad">甲乙</span>',
    "<span>甲乙</span>",
    '外部<span data-crucialy-path="[0,0]">甲乙</span>',
  ])("does not skip unrelated or unmodeled content: %s", (html) => {
    expect(
      domPointToModelPoint(model, { node: paragraph(html), offset: 0 }),
    ).toBeUndefined();
  });

  it("maps shortened DOM boundaries consistently without claiming missing text", () => {
    const node = paragraph('<span data-crucialy-path="[0,0]">甲</span>');
    const leaf = node.firstElementChild!;
    const expected = { path: [0, 0], offset: 1 };
    expect(domPointToModelPoint(model, { node, offset: 1 })).toEqual(expected);
    expect(domPointToModelPoint(model, { node: leaf, offset: 1 })).toEqual(expected);
    expect(domPointToModelPoint(model, { node: leaf.firstChild!, offset: 1 })).toEqual(
      expected,
    );
    expect(
      modelPointToDomPoint(node, model, { path: [0, 0], offset: 2 }),
    ).toBeUndefined();
  });

  it("does not clamp extra rendered text to the model end", () => {
    const node = paragraph('<span data-crucialy-path="[0,0]">甲乙丙</span>');
    expect(domPointToModelPoint(model, { node, offset: 1 })).toBeUndefined();
    expect(
      domPointToModelPoint(model, { node: node.firstElementChild!, offset: 1 }),
    ).toBeUndefined();
  });
});

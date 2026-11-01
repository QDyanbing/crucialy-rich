// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import {
  createBulletList,
  createCodeBlock,
  createDocument,
  createHeading,
  createListItem,
  createParagraph,
  createQuote,
  createTable,
  createText,
  domPointToModelPoint,
  modelPointToDomPoint,
  renderDocument,
  renderNodeToHtml,
} from "../../src";

describe("DOM mapping structure regression", () => {
  it.each([
    { block: createParagraph([createText("甲😀乙")]), tag: "p" },
    { block: createHeading(2, [createText("甲😀乙")]), tag: "h2" },
    { block: createQuote([createText("甲😀乙")]), tag: "blockquote" },
    { block: createCodeBlock([createText("甲\n😀乙")]), tag: "pre" },
  ])("maps native start/end boundaries of $tag", ({ block, tag }) => {
    const model = createDocument([block]);
    const root = document.createElement("div");
    root.innerHTML = renderNodeToHtml(renderDocument(model));
    const element = root.querySelector(tag)!;
    expect(domPointToModelPoint(model, { node: element, offset: 0 })).toEqual({
      path: [0, 0],
      offset: 0,
    });
    expect(domPointToModelPoint(model, { node: element, offset: 1 })).toEqual({
      path: [0, 0],
      offset: block.children[0]!.text.length,
    });
    const leaf = element.firstElementChild!;
    const suffix = (leaf.firstChild as Text).splitText(1);
    const point = { path: [0, 0], offset: 2 };
    expect(modelPointToDomPoint(root, model, point)).toEqual({
      node: suffix,
      offset: 1,
    });
    expect(domPointToModelPoint(model, { node: suffix, offset: 1 })).toEqual(point);
  });

  it("maps a cell paragraph but refuses structural table and root boundaries", () => {
    const table = createTable(1, 1);
    table.children[0]!.children[0]!.children = [
      createParagraph([createText("单元格")]),
    ];
    const model = createDocument([table]);
    const root = document.createElement("div");
    root.innerHTML = renderNodeToHtml(renderDocument(model));
    expect(
      domPointToModelPoint(model, { node: root.querySelector("p")!, offset: 1 }),
    ).toEqual({ path: [0, 0, 0, 0, 0], offset: 3 });
    for (const selector of ["div", "table", "tbody", "tr", "td"]) {
      expect(
        domPointToModelPoint(model, { node: root.querySelector(selector)!, offset: 0 }),
      ).toBeUndefined();
    }
  });

  it("does not absorb a nested list into its parent text boundary", () => {
    const model = createDocument([
      createBulletList([
        createListItem(
          [createText("父项")],
          createBulletList([createListItem([createText("子项")])]),
        ),
      ]),
    ]);
    const root = document.createElement("div");
    root.innerHTML = renderNodeToHtml(renderDocument(model));
    const parent = root.querySelector("li")!;
    expect(domPointToModelPoint(model, { node: parent, offset: 1 })).toEqual({
      path: [0, 0, 0],
      offset: 2,
    });
    expect(domPointToModelPoint(model, { node: parent, offset: 2 })).toBeUndefined();
    expect(
      domPointToModelPoint(model, { node: parent.querySelector("li")!, offset: 1 }),
    ).toEqual({ path: [0, 0, 1, 0, 0], offset: 2 });
  });
});

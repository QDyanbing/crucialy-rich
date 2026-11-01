// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import {
  createBulletList,
  createDocument,
  createListItem,
  createParagraph,
  createTaskItem,
  createTaskList,
  createText,
  domPointToModelPoint,
  renderDocument,
  renderNodeToHtml,
} from "../../src";

describe("DOM text container child boundaries", () => {
  it.each([
    [0, 0, 0],
    [1, 0, 0],
    [2, 1, 0],
    [3, 1, 0],
    [4, 1, 0],
    [5, 1, 2],
    [6, 1, 2],
  ])(
    "ignores formatting whitespace and comments at DOM index %s",
    (offset, textIndex, expected) => {
      const model = createDocument([
        createParagraph([createText("甲"), createText("乙后")]),
      ]);
      const holder = document.createElement("div");
      holder.innerHTML =
        '<p data-crucialy-path="[0]"> <span data-crucialy-path="[0,0]">甲</span><!-- gap -->\n<em data-crucialy-path="[0,1]">乙后</em> </p>';
      expect(
        domPointToModelPoint(model, { node: holder.firstElementChild!, offset }),
      ).toEqual({ path: [0, textIndex], offset: expected });
    },
  );

  it.each([0, 1, 2, 3, 4])(
    "maps task checkbox and nested-list boundaries at %s",
    (offset) => {
      const model = createDocument([
        createTaskList([
          createTaskItem(
            [createText("甲", { bold: true }), createText("乙后", { italic: true })],
            true,
            createBulletList([createListItem([createText("子项")])]),
          ),
        ]),
      ]);
      const holder = document.createElement("div");
      holder.innerHTML = renderNodeToHtml(renderDocument(model));
      const item = holder.querySelector("li")!;
      const point = domPointToModelPoint(model, { node: item, offset });
      expect(point).toEqual(
        offset === 4
          ? undefined
          : {
              path: [0, 0, offset < 2 ? 0 : 1],
              offset: offset === 3 ? 2 : 0,
            },
      );
      expect(
        domPointToModelPoint(model, { node: item.querySelector("input")!, offset: 0 }),
      ).toBeUndefined();
    },
  );

  it("refuses an offset beyond the actual container instead of clamping", () => {
    const model = createDocument([createParagraph([createText("甲")])]);
    const holder = document.createElement("div");
    holder.innerHTML = renderNodeToHtml(renderDocument(model));
    expect(
      domPointToModelPoint(model, { node: holder.querySelector("p")!, offset: 2 }),
    ).toBeUndefined();
  });
});

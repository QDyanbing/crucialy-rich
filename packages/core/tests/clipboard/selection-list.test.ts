import { describe, expect, it } from "vitest";
import {
  createBulletList,
  createDocument,
  createListItem,
  createText,
} from "../../src";
import { getClipboardList } from "../../src/clipboard/selection-list";

describe("clipboard sibling bullet list fragment", () => {
  const document = createDocument([
    createBulletList([
      createListItem([createText("未选前项")]),
      createListItem(
        [createText("前甲", { bold: true })],
        createBulletList([createListItem([createText("选中子项")])]),
      ),
      createListItem([createText("中间")]),
      createListItem(
        [createText("乙后", { italic: true })],
        createBulletList([createListItem([createText("未选子项")])]),
      ),
      createListItem([createText("未选后项")]),
    ]),
  ]);
  const anchor = { path: [0, 1, 0], offset: 1 };
  const focus = { path: [0, 3, 0], offset: 1 };

  it.each([false, true])(
    "clips siblings and only includes nested content inside the range (backward: %s)",
    (backward) => {
      expect(
        getClipboardList(
          document,
          backward ? { anchor: focus, focus: anchor } : { anchor, focus },
        ),
      ).toEqual(
        createBulletList([
          createListItem(
            [createText("甲", { bold: true })],
            createBulletList([createListItem([createText("选中子项")])]),
          ),
          createListItem([createText("中间")]),
          createListItem([createText("乙", { italic: true })]),
        ]),
      );
    },
  );

  it("clones nested content and marks without changing the source", () => {
    const original = structuredClone(document);
    const result = getClipboardList(document, { anchor, focus })!;
    result.children[0]!.nested!.children[0]!.children[0]!.text = "修改";
    delete result.children[0]!.children[0]!.marks!.bold;
    expect(document).toEqual(original);
  });

  it("leaves single-item, collapsed and invalid selections to existing fallback", () => {
    expect(getClipboardList(document, { anchor, focus: anchor })).toBeUndefined();
    expect(
      getClipboardList(document, { anchor, focus: { path: [0, 1, 0], offset: 2 } }),
    ).toBeUndefined();
    expect(
      getClipboardList(document, { anchor, focus: { path: [0, 9, 0], offset: 0 } }),
    ).toBeUndefined();
  });
});

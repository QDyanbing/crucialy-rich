import { describe, expect, it } from "vitest";
import {
  canExecutePasteCommand,
  createBulletList,
  createDocument,
  createListItem,
  createParagraph,
  createText,
  parseHtml,
  parseMarkdown,
  parsePlainText,
  pasteCommand,
} from "../../src";

function listDocument() {
  return createDocument([
    createBulletList([
      createListItem(
        [createText("父项")],
        createBulletList([createListItem([createText("子项")])]),
      ),
      createListItem([createText("邻项")]),
    ]),
    createBulletList([createListItem([createText("另一列表")])]),
    createParagraph([createText("列表后方")]),
  ]);
}

describe("list paste boundaries", () => {
  it.each([
    { name: "another sibling item", path: [0, 1, 0], offset: 1 },
    { name: "a descendant item", path: [0, 0, 1, 0, 0], offset: 1 },
    { name: "another list", path: [1, 0, 0], offset: 1 },
    { name: "outside the list", path: [2, 0], offset: 1 },
    { name: "an invalid offset", path: [0, 0, 0], offset: 99 },
    { name: "the nested list node", path: [0, 0, 1], offset: 0 },
    { name: "a missing text node", path: [0, 0, 9], offset: 0 },
  ])("rejects $name without producing a transaction", ({ path, offset }) => {
    const document = listDocument();
    const snapshot = structuredClone(document);
    const input = {
      context: {
        document,
        selection: {
          anchor: { path: [0, 0, 0], offset: 0 },
          focus: { path, offset },
        },
      },
      payload: { fragment: parsePlainText("甲\n乙")! },
    };

    expect(canExecutePasteCommand(input)).toBe(false);
    expect(pasteCommand.execute(input)).toMatchObject({ status: "skipped", ok: false });
    expect(pasteCommand.execute(input).transaction).toBeUndefined();
    expect(document).toEqual(snapshot);
  });

  it.each([parseHtml("<p>结构文本</p>")!, parseMarkdown("**结构文本**")!])(
    "does not insert a $mimeType fragment into an existing list item",
    (fragment) => {
      const document = listDocument();
      const point = { path: [0, 0, 0], offset: 1 };
      const input = {
        context: { document, selection: { anchor: point, focus: point } },
        payload: { fragment },
      };
      expect(canExecutePasteCommand(input)).toBe(false);
      expect(pasteCommand.execute(input).transaction).toBeUndefined();
    },
  );

  it("rejects non-paragraph blocks even when labelled as plain text", () => {
    const document = listDocument();
    const point = { path: [0, 0, 0], offset: 1 };
    const input = {
      context: { document, selection: { anchor: point, focus: point } },
      payload: {
        fragment: { ...parseHtml("<ul><li>项目</li></ul>")!, mimeType: "text/plain" },
      },
    };
    expect(canExecutePasteCommand(input)).toBe(false);
    expect(pasteCommand.execute(input).transaction).toBeUndefined();
  });
});

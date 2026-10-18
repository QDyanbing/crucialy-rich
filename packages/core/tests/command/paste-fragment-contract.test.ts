import { describe, expect, it } from "vitest";
import {
  canExecutePasteCommand,
  createBulletList,
  createCodeBlock,
  createDocument,
  createHeading,
  createListItem,
  createParagraph,
  createTable,
  createText,
  parseClipboardData,
  pasteCommand,
  plainTextClipboardParser,
} from "../../src";

describe("plain clipboard fragment capability contract", () => {
  describe.each([
    {
      name: "paragraph",
      document: createDocument([createParagraph([createText("前后")])]),
      path: [0, 0],
      offset: 1,
    },
    {
      name: "code",
      document: createDocument([createCodeBlock([createText("前后")])]),
      path: [0, 0],
      offset: 1,
    },
    {
      name: "list",
      document: createDocument([
        createBulletList([createListItem([createText("前后")])]),
      ]),
      path: [0, 0, 0],
      offset: 1,
    },
    {
      name: "cell",
      document: createDocument([createTable()]),
      path: [0, 0, 0, 0, 0],
      offset: 0,
    },
  ])("$name target", ({ document, path, offset }) => {
    it.each([createHeading(1, [createText("伪纯文本")]), createTable(1, 1)])(
      "rejects a $type block labelled text/plain",
      (block) => {
        const snapshot = structuredClone(document);
        const point = { path, offset };
        const input = {
          context: { document, selection: { anchor: point, focus: point } },
          payload: { fragment: { mimeType: "text/plain", blocks: [block] } },
        };
        expect(canExecutePasteCommand(input)).toBe(false);
        expect(pasteCommand.execute(input).transaction).toBeUndefined();
        expect(document).toEqual(snapshot);
      },
    );
  });

  it("continues to a usable same-MIME parser when a custom candidate cannot execute", () => {
    const point = { path: [0, 0], offset: 0 };
    const context = {
      document: createDocument([createCodeBlock()]),
      selection: { anchor: point, focus: point },
    };
    const fragment = parseClipboardData(
      { types: ["text/plain"], getData: () => "原始文本" },
      [
        {
          mimeType: "text/plain",
          parse: () => ({
            mimeType: "text/plain",
            blocks: [createHeading(1, [createText("错误候选")])],
          }),
        },
        plainTextClipboardParser,
      ],
      (candidate) =>
        canExecutePasteCommand({ context, payload: { fragment: candidate } }),
    );
    expect(fragment?.blocks).toEqual([createParagraph([createText("原始文本")])]);
  });
});

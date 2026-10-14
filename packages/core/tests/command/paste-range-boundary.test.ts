import { describe, expect, it } from "vitest";

import {
  applyTransaction,
  canExecutePasteCommand,
  createBulletList,
  createCodeBlock,
  createDivider,
  createDocument,
  createImage,
  createListItem,
  createParagraph,
  createTable,
  createTableCell,
  createTableRow,
  createText,
  parseHtml,
  parseMarkdown,
  parsePlainText,
  pasteCommand,
  validateDocument,
} from "../../src";

describe("range paste boundaries", () => {
  it.each([
    createDivider(),
    createImage("https://example.com/image.png"),
    createBulletList([createListItem([createText("列表")])]),
    createTable(),
  ])("skips text ranges across $type", (boundary) => {
    const document = createDocument([
      createParagraph([createText("开头")]),
      boundary,
      createParagraph([createText("结尾")]),
    ]);
    const snapshot = structuredClone(document);
    const input = {
      context: {
        document,
        selection: {
          anchor: { path: [0, 0], offset: 1 },
          focus: { path: [2, 0], offset: 1 },
        },
      },
      payload: { fragment: parsePlainText("新")! },
    };

    expect(canExecutePasteCommand(input)).toBe(false);
    expect(pasteCommand.execute(input)).toMatchObject({ status: "skipped", ok: false });
    expect(pasteCommand.execute(input).transaction).toBeUndefined();
    expect(document).toEqual(snapshot);
  });

  it.each([
    { name: "another cell", point: { path: [0, 0, 1, 0, 0], offset: 1 } },
    { name: "outside the table", point: { path: [1, 0], offset: 1 } },
    { name: "invalid offset", point: { path: [0, 0, 0, 0, 0], offset: 99 } },
    { name: "missing paragraph", point: { path: [0, 0, 0, 1, 0], offset: 1 } },
  ])("rejects $name without throwing or mutating", ({ point }) => {
    const document = createDocument([
      {
        type: "table",
        children: [
          createTableRow([
            createTableCell([createParagraph([createText("开头")])]),
            createTableCell([createParagraph([createText("邻格")])]),
          ]),
        ],
      },
      createParagraph([createText("后方")]),
    ]);
    const snapshot = structuredClone(document);
    const input = {
      context: {
        document,
        selection: {
          anchor: { path: [0, 0, 0, 0, 0], offset: 1 },
          focus: point,
        },
      },
      payload: { fragment: parsePlainText("新")! },
    };

    expect(canExecutePasteCommand(input)).toBe(false);
    expect(pasteCommand.execute(input).transaction).toBeUndefined();
    expect(document).toEqual(snapshot);
  });

  it.each([parseHtml("<p>新</p>")!, parseMarkdown("**新**")!])(
    "does not insert $mimeType block fragments into cell paragraphs",
    (fragment) => {
      const document = createDocument([createTable()]);
      const input = {
        context: {
          document,
          selection: {
            anchor: { path: [0, 0, 0, 0, 0], offset: 0 },
            focus: { path: [0, 0, 0, 0, 0], offset: 0 },
          },
        },
        payload: { fragment },
      };
      expect(canExecutePasteCommand(input)).toBe(false);
      expect(pasteCommand.execute(input).status).toBe("skipped");
    },
  );

  it("keeps a CodeBlock prefix pure when the deleted range ends in marked text", () => {
    const document = createDocument([
      createCodeBlock([createText("开头")]),
      createParagraph([createText("结尾", { italic: true })]),
    ]);
    const result = pasteCommand.execute({
      context: {
        document,
        selection: {
          anchor: { path: [0, 0], offset: 1 },
          focus: { path: [1, 0], offset: 1 },
        },
      },
      payload: { fragment: parsePlainText("新")! },
    });
    const next = applyTransaction(document, result.transaction!);

    expect(next).toEqual(createDocument([createCodeBlock([createText("开新尾")])]));
    expect(result.selection?.anchor).toEqual({ path: [0, 0], offset: 2 });
    expect(validateDocument(next).valid).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import {
  createDocument,
  createParagraph,
  createTable,
  createText,
  getClipboardHtml,
  getClipboardText,
  parseHtml,
} from "../../src";

describe("table clipboard ownership and range boundaries", () => {
  const table = createTable(2, 2);
  for (const row of table.children)
    for (const cell of row.children)
      cell.children = [createParagraph([createText("文字")])];

  it.each([
    {
      anchor: { path: [0, 0, 0, 0, 0], offset: 1 },
      focus: { path: [0, 1, 1, 0, 0], offset: 2 },
    },
    {
      anchor: { path: [0, 0, 0, 0, 0], offset: 0 },
      focus: { path: [1, 1, 1, 0, 0], offset: 2 },
    },
    {
      anchor: { path: [0, 0, 0, 0, 0], offset: 1 },
      focus: { path: [2, 0], offset: 2 },
    },
  ])(
    "falls back to the complete plain range for unsupported ownership: %j",
    (selection) => {
      const document = createDocument([
        table,
        structuredClone(table),
        createParagraph([createText("正文")]),
      ]);
      expect(getClipboardText(document, selection)).toBeTruthy();
      expect(getClipboardHtml(document, selection)).toBeUndefined();
      expect(
        getClipboardHtml(document, {
          anchor: selection.focus,
          focus: selection.anchor,
        }),
      ).toBeUndefined();
    },
  );

  it("does not fill missing cells in a ragged source table", () => {
    const ragged = structuredClone(table);
    ragged.children[1]!.children.pop();
    const document = createDocument([ragged]);
    const selection = {
      anchor: { path: [0, 0, 0, 0, 0], offset: 0 },
      focus: { path: [0, 1, 0, 0, 0], offset: 2 },
    };
    expect(getClipboardText(document, selection)).toBe("文字\t文字\n文字");
    expect(getClipboardHtml(document, selection)).toBeUndefined();
  });

  it("retains empty boundary cells when only their separator is selected", () => {
    const document = createDocument([table]);
    const selection = {
      anchor: { path: [0, 0, 0, 0, 0], offset: 2 },
      focus: { path: [0, 0, 1, 0, 0], offset: 0 },
    };
    expect(getClipboardText(document, selection)).toBe("\t");
    expect(parseHtml(getClipboardHtml(document, selection)!)?.blocks).toEqual([
      createTable(1, 2),
    ]);
  });

  it("does not export collapsed or invalid cross-cell endpoints", () => {
    const document = createDocument([table]);
    const anchor = { path: [0, 0, 0, 0, 0], offset: 0 };
    expect(getClipboardHtml(document, { anchor, focus: anchor })).toBeUndefined();
    expect(
      getClipboardHtml(document, {
        anchor,
        focus: { path: [0, 0, 1, 0, 0], offset: 99 },
      }),
    ).toBeUndefined();
  });
});

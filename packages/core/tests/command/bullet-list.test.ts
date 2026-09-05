import { describe, expect, it } from "vitest";

import {
  applyTransaction,
  canExecuteToggleBulletListCommand,
  createBulletList,
  createDocument,
  createListItem,
  createParagraph,
  createText,
  isBulletListCommandActive,
  toggleBulletListCommand,
} from "../../src";

describe("toggleBulletListCommand", () => {
  it("wraps selected paragraphs and maps the selection", () => {
    const document = createDocument([
      createParagraph([createText("一", { bold: true })]),
      createParagraph([createText("二")]),
    ]);
    const selection = {
      anchor: { offset: 0, path: [0, 0] },
      focus: { offset: 1, path: [1, 0] },
    };
    const input = { context: { document, selection } };
    const result = toggleBulletListCommand.execute(input);

    expect(canExecuteToggleBulletListCommand(input)).toBe(true);
    expect(applyTransaction(document, result.transaction!)).toEqual(
      createDocument([
        createBulletList([
          createListItem([createText("一", { bold: true })]),
          createListItem([createText("二")]),
        ]),
      ]),
    );
    expect(result.selection).toEqual({
      anchor: { offset: 0, path: [0, 0, 0] },
      focus: { offset: 1, path: [0, 1, 0] },
    });
  });

  it("unwraps a bullet list into paragraphs", () => {
    const document = createDocument([
      createBulletList([
        createListItem([createText("一")]),
        createListItem([createText("二")]),
      ]),
    ]);
    const selection = {
      anchor: { offset: 0, path: [0, 0, 0] },
      focus: { offset: 1, path: [0, 1, 0] },
    };
    const input = { context: { document, selection } };
    const result = toggleBulletListCommand.execute(input);

    expect(isBulletListCommandActive(input)).toBe(true);
    expect(applyTransaction(document, result.transaction!)).toEqual(
      createDocument([
        createParagraph([createText("一")]),
        createParagraph([createText("二")]),
      ]),
    );
    expect(result.selection).toEqual({
      anchor: { offset: 0, path: [0, 0] },
      focus: { offset: 1, path: [1, 0] },
    });
  });

  it("skips unsupported mixed block selections", () => {
    const document = createDocument([
      createParagraph([createText("正文")]),
      createBulletList([createListItem([createText("项目")])]),
    ]);
    const input = {
      context: {
        document,
        selection: {
          anchor: { offset: 0, path: [0, 0] },
          focus: { offset: 1, path: [1, 0, 0] },
        },
      },
    };

    expect(canExecuteToggleBulletListCommand(input)).toBe(false);
    expect(toggleBulletListCommand.execute(input).status).toBe("skipped");
  });
});

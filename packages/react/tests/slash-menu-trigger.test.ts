import {
  createDocument,
  createHeading,
  createParagraph,
  createText,
  type RangeSelection,
} from "@crucialy-rich/core";
import { describe, expect, it } from "vitest";

import { findSlashMenuTrigger } from "../src/slash-menu/trigger";

function collapsedSelection(offset: number, path = [0, 0]): RangeSelection {
  return {
    anchor: { offset, path },
    focus: { offset, path: [...path] },
  };
}

describe("findSlashMenuTrigger", () => {
  it("recognizes a slash and query at the start of a paragraph", () => {
    const document = createDocument([createParagraph([createText("/he")])]);

    expect(findSlashMenuTrigger(document, collapsedSelection(3))).toEqual({
      query: "he",
      range: {
        anchor: { offset: 0, path: [0, 0] },
        focus: { offset: 3, path: [0, 0] },
      },
      text: "/he",
    });
  });

  it("recognizes a slash after whitespace without including the whitespace", () => {
    const document = createDocument([createParagraph([createText("正文 /标")])]);

    expect(findSlashMenuTrigger(document, collapsedSelection(5))).toMatchObject({
      query: "标",
      range: { anchor: { offset: 3 }, focus: { offset: 5 } },
      text: "/标",
    });
  });

  it("returns a range across adjacent marked text nodes", () => {
    const document = createDocument([
      createParagraph([
        createText("/", { bold: true }),
        createText("he", { italic: true }),
      ]),
    ]);

    expect(findSlashMenuTrigger(document, collapsedSelection(2, [0, 1]))).toEqual({
      query: "he",
      range: {
        anchor: { offset: 0, path: [0, 0] },
        focus: { offset: 2, path: [0, 1] },
      },
      text: "/he",
    });
  });

  it.each(["正文/标", "/标 题", "//heading"])(
    "rejects an invalid trigger in %s",
    (text) => {
      const document = createDocument([createParagraph([createText(text)])]);

      expect(
        findSlashMenuTrigger(document, collapsedSelection(text.length)),
      ).toBeUndefined();
    },
  );

  it("rejects a non-collapsed selection", () => {
    const document = createDocument([createParagraph([createText("/he")])]);

    expect(
      findSlashMenuTrigger(document, {
        anchor: { offset: 0, path: [0, 0] },
        focus: { offset: 3, path: [0, 0] },
      }),
    ).toBeUndefined();
  });

  it("rejects slash text outside a paragraph", () => {
    const document = createDocument([createHeading(2, [createText("/he")])]);

    expect(findSlashMenuTrigger(document, collapsedSelection(3))).toBeUndefined();
  });

  it("rejects a missing or invalid selection", () => {
    const document = createDocument([createParagraph([createText("/he")])]);

    expect(findSlashMenuTrigger(document)).toBeUndefined();
    expect(findSlashMenuTrigger(document, collapsedSelection(4))).toBeUndefined();
  });
});

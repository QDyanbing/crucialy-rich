import { describe, expect, it } from "vitest";

import {
  createDocument,
  createHeading,
  createParagraph,
  createText,
  findMarkdownInputRule,
} from "../../src";

function findRule(text: string, data: string) {
  const document = createDocument([createParagraph([createText(text)])]);

  return findMarkdownInputRule({
    data,
    document,
    selection: {
      anchor: { path: [0, 0], offset: text.length },
      focus: { path: [0, 0], offset: text.length },
    },
  });
}

describe("findMarkdownInputRule", () => {
  it.each([
    ["#", " ", "heading"],
    ["-", " ", "bulletList"],
    ["1.", " ", "orderedList"],
    [">", " ", "quote"],
    ["``", "`", "codeBlock"],
  ])("matches %s plus input data", (text, data, name) => {
    expect(findRule(text, data)).toMatchObject({
      blockIndex: 0,
      name,
      prefixRange: {
        anchor: { path: [0, 0], offset: 0 },
        focus: { path: [0, 0], offset: text.length },
      },
    });
  });

  it("rejects prefixes after existing paragraph text", () => {
    expect(findRule("正文 #", " ")).toBeUndefined();
  });

  it("rejects non-collapsed selections", () => {
    const document = createDocument([createParagraph([createText("#")])]);

    expect(
      findMarkdownInputRule({
        data: " ",
        document,
        selection: {
          anchor: { path: [0, 0], offset: 0 },
          focus: { path: [0, 0], offset: 1 },
        },
      }),
    ).toBeUndefined();
  });

  it("rejects existing non-paragraph blocks", () => {
    const document = createDocument([createHeading(1, [createText("#")])]);

    expect(
      findMarkdownInputRule({
        data: " ",
        document,
        selection: {
          anchor: { path: [0, 0], offset: 1 },
          focus: { path: [0, 0], offset: 1 },
        },
      }),
    ).toBeUndefined();
  });
});

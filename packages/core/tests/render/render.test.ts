import { describe, expect, it } from "vitest";

import {
  createDocument,
  createParagraph,
  createText,
  type DocumentNode,
} from "../../src/model";
import { MODEL_PATH_ATTRIBUTE, renderDocument } from "../../src/render";

describe("renderDocument", () => {
  it("renders an empty document as an empty root", () => {
    const document: DocumentNode = {
      type: "document",
      children: [],
    };

    expect(renderDocument(document)).toEqual({
      tagName: "div",
      path: [],
      attributes: {
        [MODEL_PATH_ATTRIBUTE]: "[]",
      },
      children: [],
    });
  });

  it("renders an empty paragraph without text children", () => {
    const document: DocumentNode = {
      type: "document",
      children: [{ type: "paragraph", children: [] }],
    };

    expect(renderDocument(document)).toEqual({
      tagName: "div",
      path: [],
      attributes: {
        [MODEL_PATH_ATTRIBUTE]: "[]",
      },
      children: [
        {
          tagName: "p",
          path: [0],
          attributes: {
            [MODEL_PATH_ATTRIBUTE]: "[0]",
          },
          children: [],
        },
      ],
    });
  });

  it("renders document, paragraph, and text nodes with model paths", () => {
    const document = createDocument([
      createParagraph([createText("Hello"), createText(" world")]),
      createParagraph([createText("Second")]),
    ]);

    expect(renderDocument(document)).toEqual({
      tagName: "div",
      path: [],
      attributes: {
        [MODEL_PATH_ATTRIBUTE]: "[]",
      },
      children: [
        {
          tagName: "p",
          path: [0],
          attributes: {
            [MODEL_PATH_ATTRIBUTE]: "[0]",
          },
          children: [
            {
              tagName: "span",
              path: [0, 0],
              attributes: {
                [MODEL_PATH_ATTRIBUTE]: "[0,0]",
              },
              text: "Hello",
            },
            {
              tagName: "span",
              path: [0, 1],
              attributes: {
                [MODEL_PATH_ATTRIBUTE]: "[0,1]",
              },
              text: " world",
            },
          ],
        },
        {
          tagName: "p",
          path: [1],
          attributes: {
            [MODEL_PATH_ATTRIBUTE]: "[1]",
          },
          children: [
            {
              tagName: "span",
              path: [1, 0],
              attributes: {
                [MODEL_PATH_ATTRIBUTE]: "[1,0]",
              },
              text: "Second",
            },
          ],
        },
      ],
    });
  });

  it("renders bold text marks as strong elements", () => {
    const document = createDocument([
      createParagraph([createText("Bold", { bold: true })]),
    ]);

    expect(renderDocument(document).children?.[0]?.children?.[0]).toEqual({
      tagName: "strong",
      path: [0, 0],
      attributes: {
        [MODEL_PATH_ATTRIBUTE]: "[0,0]",
      },
      text: "Bold",
    });
  });
});

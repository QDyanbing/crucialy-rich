import { describe, expect, it } from "vitest";

import {
  createBulletList,
  createCodeBlock,
  createDocument,
  createDivider,
  createHeading,
  createListItem,
  createOrderedList,
  createParagraph,
  createQuote,
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

  it("renders headings and quotes semantically", () => {
    const document = createDocument([
      createHeading(2, [createText("标题", { bold: true })]),
      createQuote([createText("引用", { italic: true })]),
    ]);
    const rendered = renderDocument(document);

    expect(rendered.children?.map((node) => node.tagName)).toEqual([
      "h2",
      "blockquote",
    ]);
    expect(rendered.children?.[0]).toMatchObject({
      children: [{ tagName: "strong", text: "标题" }],
      path: [0],
    });
    expect(rendered.children?.[1]).toMatchObject({
      children: [{ tagName: "em", text: "引用" }],
      path: [1],
    });
  });

  it("renders code blocks as pre and code with model paths", () => {
    const document = createDocument([
      createCodeBlock([createText("const value = 1;\nreturn value;")]),
    ]);

    expect(renderDocument(document).children?.[0]).toEqual({
      attributes: { [MODEL_PATH_ATTRIBUTE]: "[0]" },
      children: [
        {
          attributes: { [MODEL_PATH_ATTRIBUTE]: "[0,0]" },
          path: [0, 0],
          tagName: "code",
          text: "const value = 1;\nreturn value;",
        },
      ],
      path: [0],
      tagName: "pre",
    });
  });

  it("renders dividers as void elements with model paths", () => {
    const document = createDocument([createDivider()]);

    expect(renderDocument(document).children?.[0]).toEqual({
      attributes: { [MODEL_PATH_ATTRIBUTE]: "[0]" },
      path: [0],
      tagName: "hr",
    });
  });

  it("renders ordered and unordered lists with nested model paths", () => {
    const document = createDocument([
      createBulletList([
        createListItem([createText("无序一", { bold: true })]),
        createListItem([createText("无序二")]),
      ]),
      createOrderedList([createListItem([createText("有序一")])]),
    ]);
    const rendered = renderDocument(document);

    expect(rendered.children?.[0]).toMatchObject({
      children: [
        {
          children: [{ path: [0, 0, 0], tagName: "strong", text: "无序一" }],
          path: [0, 0],
          tagName: "li",
        },
        {
          children: [{ path: [0, 1, 0], tagName: "span", text: "无序二" }],
          path: [0, 1],
          tagName: "li",
        },
      ],
      path: [0],
      tagName: "ul",
    });
    expect(rendered.children?.[1]).toMatchObject({
      children: [{ path: [1, 0], tagName: "li" }],
      path: [1],
      tagName: "ol",
    });
  });

  it("maps every supported heading level to its semantic tag", () => {
    const document = createDocument(
      ([1, 2, 3, 4, 5, 6] as const).map((level) =>
        createHeading(level, [createText(`Heading ${level}`)]),
      ),
    );
    const rendered = renderDocument(document);

    expect(rendered.children?.map((node) => node.tagName)).toEqual([
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
    ]);
    expect(rendered.children?.map((node) => node.path)).toEqual([
      [0],
      [1],
      [2],
      [3],
      [4],
      [5],
    ]);
    expect(rendered.children?.[5]?.children?.[0]).toMatchObject({
      path: [5, 0],
      text: "Heading 6",
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

  it("renders italic text marks as em elements", () => {
    const document = createDocument([
      createParagraph([createText("Italic", { italic: true })]),
    ]);

    expect(renderDocument(document).children?.[0]?.children?.[0]).toEqual({
      tagName: "em",
      path: [0, 0],
      attributes: {
        [MODEL_PATH_ATTRIBUTE]: "[0,0]",
      },
      text: "Italic",
    });
  });

  it("renders underline text marks as u elements", () => {
    const document = createDocument([
      createParagraph([createText("Underline", { underline: true })]),
    ]);

    expect(renderDocument(document).children?.[0]?.children?.[0]).toEqual({
      tagName: "u",
      path: [0, 0],
      attributes: {
        [MODEL_PATH_ATTRIBUTE]: "[0,0]",
      },
      text: "Underline",
    });
  });

  it("renders strike text marks as s elements", () => {
    const document = createDocument([
      createParagraph([createText("Strike", { strike: true })]),
    ]);

    expect(renderDocument(document).children?.[0]?.children?.[0]).toEqual({
      tagName: "s",
      path: [0, 0],
      attributes: {
        [MODEL_PATH_ATTRIBUTE]: "[0,0]",
      },
      text: "Strike",
    });
  });

  it("renders link marks as anchors with safe attributes", () => {
    const document = createDocument([
      createParagraph([
        createText("Documentation", {
          link: {
            href: "https://example.com/docs",
            rel: "noopener noreferrer",
            target: "_blank",
          },
        }),
      ]),
    ]);

    expect(renderDocument(document).children?.[0]?.children?.[0]).toEqual({
      attributes: {
        href: "https://example.com/docs",
        [MODEL_PATH_ATTRIBUTE]: "[0,0]",
        rel: "noopener noreferrer",
        target: "_blank",
      },
      path: [0, 0],
      style: { textDecoration: "underline" },
      tagName: "a",
      text: "Documentation",
    });
  });

  it("omits absent optional link attributes", () => {
    const document = createDocument([
      createParagraph([
        createText("Email", { link: { href: "mailto:team@example.com" } }),
      ]),
    ]);

    expect(renderDocument(document).children?.[0]?.children?.[0]).toMatchObject({
      attributes: {
        href: "mailto:team@example.com",
        [MODEL_PATH_ATTRIBUTE]: "[0,0]",
      },
      tagName: "a",
    });
    expect(
      renderDocument(document).children?.[0]?.children?.[0]?.attributes,
    ).not.toHaveProperty("target");
  });

  it("renders links with composed text marks on one model path", () => {
    const document = createDocument([
      createParagraph([
        createText("Styled link", {
          backgroundColor: "#fff4cc",
          bold: true,
          fontSize: 18,
          italic: true,
          link: { href: "https://example.com/docs" },
          strike: true,
          textColor: "#1677ff",
        }),
      ]),
    ]);

    expect(renderDocument(document).children?.[0]?.children?.[0]).toEqual({
      attributes: {
        href: "https://example.com/docs",
        [MODEL_PATH_ATTRIBUTE]: "[0,0]",
      },
      path: [0, 0],
      style: {
        backgroundColor: "#fff4cc",
        color: "#1677ff",
        fontSize: "18px",
        fontStyle: "italic",
        fontWeight: "700",
        textDecoration: "underline line-through",
      },
      tagName: "a",
      text: "Styled link",
    });
  });

  it("renders combined bold and italic marks without nested text paths", () => {
    const document = createDocument([
      createParagraph([createText("Both", { bold: true, italic: true })]),
    ]);

    expect(renderDocument(document).children?.[0]?.children?.[0]).toEqual({
      tagName: "strong",
      path: [0, 0],
      attributes: {
        [MODEL_PATH_ATTRIBUTE]: "[0,0]",
      },
      style: { fontStyle: "italic" },
      text: "Both",
    });
  });

  it("renders underline with bold and italic on one text path", () => {
    const document = createDocument([
      createParagraph([
        createText("Stacked", {
          bold: true,
          italic: true,
          underline: true,
        }),
      ]),
    ]);

    expect(renderDocument(document).children?.[0]?.children?.[0]).toEqual({
      tagName: "strong",
      path: [0, 0],
      attributes: {
        [MODEL_PATH_ATTRIBUTE]: "[0,0]",
      },
      style: { fontStyle: "italic", textDecoration: "underline" },
      text: "Stacked",
    });
  });

  it("renders all boolean marks on one text path", () => {
    const document = createDocument([
      createParagraph([
        createText("All", {
          bold: true,
          italic: true,
          strike: true,
          underline: true,
        }),
      ]),
    ]);

    expect(renderDocument(document).children?.[0]?.children?.[0]).toEqual({
      tagName: "strong",
      path: [0, 0],
      attributes: {
        [MODEL_PATH_ATTRIBUTE]: "[0,0]",
      },
      style: {
        fontStyle: "italic",
        textDecoration: "underline line-through",
      },
      text: "All",
    });
  });

  it("renders a supported font size as a pixel style", () => {
    const document = createDocument([
      createParagraph([createText("Sized", { fontSize: 18 })]),
    ]);

    expect(renderDocument(document).children?.[0]?.children?.[0]).toEqual({
      attributes: {
        [MODEL_PATH_ATTRIBUTE]: "[0,0]",
      },
      path: [0, 0],
      style: { fontSize: "18px" },
      tagName: "span",
      text: "Sized",
    });
  });

  it("combines font size with boolean mark styles", () => {
    const document = createDocument([
      createParagraph([
        createText("Combined", {
          bold: true,
          fontSize: 24,
          italic: true,
          underline: true,
        }),
      ]),
    ]);

    expect(renderDocument(document).children?.[0]?.children?.[0]?.style).toEqual({
      fontSize: "24px",
      fontStyle: "italic",
      textDecoration: "underline",
    });
  });

  it("does not render an unsupported font size", () => {
    const document = createDocument([
      createParagraph([createText("Unsafe", { fontSize: 100 })]),
    ]);

    expect(
      renderDocument(document).children?.[0]?.children?.[0]?.style,
    ).toBeUndefined();
  });

  it("renders a safe text color", () => {
    const document = createDocument([
      createParagraph([createText("Colored", { textColor: "#0AF" })]),
    ]);

    expect(renderDocument(document).children?.[0]?.children?.[0]).toEqual({
      attributes: {
        [MODEL_PATH_ATTRIBUTE]: "[0,0]",
      },
      path: [0, 0],
      style: { color: "#00aaff" },
      tagName: "span",
      text: "Colored",
    });
  });

  it("combines text color with font size and boolean marks", () => {
    const document = createDocument([
      createParagraph([
        createText("Combined", {
          bold: true,
          fontSize: 24,
          italic: true,
          textColor: "#1677ff",
          underline: true,
        }),
      ]),
    ]);

    expect(renderDocument(document).children?.[0]?.children?.[0]?.style).toEqual({
      color: "#1677ff",
      fontSize: "24px",
      fontStyle: "italic",
      textDecoration: "underline",
    });
  });

  it("does not render an unsafe text color", () => {
    const document = createDocument([
      createParagraph([createText("Unsafe", { textColor: "red" })]),
    ]);

    expect(
      renderDocument(document).children?.[0]?.children?.[0]?.style,
    ).toBeUndefined();
  });

  it("renders a safe background color", () => {
    const document = createDocument([
      createParagraph([createText("Highlighted", { backgroundColor: "#FC0" })]),
    ]);

    expect(renderDocument(document).children?.[0]?.children?.[0]).toEqual({
      attributes: {
        [MODEL_PATH_ATTRIBUTE]: "[0,0]",
      },
      path: [0, 0],
      style: { backgroundColor: "#ffcc00" },
      tagName: "span",
      text: "Highlighted",
    });
  });

  it("combines background color with text color and other marks", () => {
    const document = createDocument([
      createParagraph([
        createText("Combined", {
          backgroundColor: "#fff4cc",
          bold: true,
          fontSize: 24,
          italic: true,
          textColor: "#1677ff",
          underline: true,
        }),
      ]),
    ]);

    expect(renderDocument(document).children?.[0]?.children?.[0]?.style).toEqual({
      backgroundColor: "#fff4cc",
      color: "#1677ff",
      fontSize: "24px",
      fontStyle: "italic",
      textDecoration: "underline",
    });
  });

  it("does not render an unsafe background color", () => {
    const document = createDocument([
      createParagraph([createText("Unsafe", { backgroundColor: "yellow" })]),
    ]);

    expect(
      renderDocument(document).children?.[0]?.children?.[0]?.style,
    ).toBeUndefined();
  });
});

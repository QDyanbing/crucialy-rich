import { describe, expect, it } from "vitest";

import {
  createDocument,
  createHeading,
  createParagraph,
  createQuote,
  createText,
} from "../../src/model/factories";
import { HEADING_LEVELS } from "../../src/model/types";
import { validateDocument } from "../../src/model/validate";

describe("validateDocument", () => {
  it("accepts a well-formed document", () => {
    const document = createDocument([createParagraph([createText("hi")])]);
    expect(validateDocument(document)).toEqual({ valid: true, errors: [] });
  });

  it("accepts an empty document", () => {
    const result = validateDocument({ type: "document", children: [] });
    expect(result.valid).toBe(true);
  });

  it("accepts heading and quote blocks", () => {
    const document = createDocument([
      ...HEADING_LEVELS.map((level) =>
        createHeading(level, [createText(`标题 ${level}`, { bold: true })]),
      ),
      createQuote([createText("引用", { italic: true })]),
      createParagraph([createText("正文")]),
    ]);

    expect(validateDocument(document)).toEqual({ errors: [], valid: true });
  });

  it("rejects headings with unsupported levels", () => {
    for (const level of [0, 7, 1.5, "1"]) {
      const result = validateDocument({
        children: [{ children: [], level, type: "heading" }],
        type: "document",
      });

      expect(result).toEqual({
        errors: [
          {
            message: "document 子节点必须是块级节点",
            path: [0],
          },
        ],
        valid: false,
      });
    }
  });

  it("rejects non-text children inside heading and quote blocks", () => {
    const result = validateDocument({
      children: [
        { children: [{ type: "inline" }], level: 2, type: "heading" },
        { children: [{ type: "paragraph", children: [] }], type: "quote" },
      ],
      type: "document",
    });

    expect(result).toEqual({
      errors: [
        { message: "块级节点子节点必须是 text 节点", path: [0, 0] },
        { message: "块级节点子节点必须是 text 节点", path: [1, 0] },
      ],
      valid: false,
    });
  });

  it("rejects a non-document root", () => {
    const result = validateDocument({ type: "paragraph", children: [] });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toEqual({
      path: [],
      message: "根节点必须是 document 节点",
    });
  });

  it("rejects a non-block document child", () => {
    const result = validateDocument({
      type: "document",
      children: [{ type: "text", text: "loose" }],
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0]?.path).toEqual([0]);
  });

  it("rejects an unknown document child type", () => {
    const result = validateDocument({
      type: "document",
      children: [{ type: "heading", children: [] }],
    });

    expect(result.valid).toBe(false);
    expect(result.errors[0]).toEqual({
      path: [0],
      message: "document 子节点必须是块级节点",
    });
  });

  it("rejects a non-text paragraph child", () => {
    const result = validateDocument({
      type: "document",
      children: [
        { type: "paragraph", children: [{ type: "paragraph", children: [] }] },
      ],
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0]?.path).toEqual([0, 0]);
  });

  it("rejects an unknown paragraph child type", () => {
    const result = validateDocument({
      type: "document",
      children: [{ type: "paragraph", children: [{ type: "inline", text: "x" }] }],
    });

    expect(result.valid).toBe(false);
    expect(result.errors[0]).toEqual({
      path: [0, 0],
      message: "块级节点子节点必须是 text 节点",
    });
  });

  it("accepts supported text marks", () => {
    const document = createDocument([
      createParagraph([
        createText("hi", {
          bold: true,
          italic: true,
          strike: true,
          underline: true,
        }),
      ]),
    ]);

    expect(validateDocument(document)).toEqual({ valid: true, errors: [] });
  });

  it("accepts attribute and boolean marks together", () => {
    const document = createDocument([
      createParagraph([
        createText("styled", {
          backgroundColor: "#fff4cc",
          bold: true,
          fontSize: 16,
          textColor: "#1c2520",
        }),
      ]),
    ]);

    expect(validateDocument(document)).toEqual({ valid: true, errors: [] });
  });

  it("accepts a safe link with text styles", () => {
    const document = createDocument([
      createParagraph([
        createText("文档", {
          bold: true,
          link: {
            href: "https://example.com/docs",
            rel: "noopener noreferrer",
            target: "_blank",
          },
          textColor: "#1677ff",
        }),
      ]),
    ]);

    expect(validateDocument(document)).toEqual({ errors: [], valid: true });
  });

  it("rejects invalid attribute mark values", () => {
    const result = validateDocument({
      type: "document",
      children: [
        {
          type: "paragraph",
          children: [
            {
              type: "text",
              text: "x",
              marks: {
                backgroundColor: "",
                fontSize: 0,
                textColor: 123,
              },
            },
          ],
        },
      ],
    });

    expect(result).toEqual({
      valid: false,
      errors: [
        {
          path: [0, 0],
          message: "text mark backgroundColor 的值必须是 #RGB 或 #RRGGBB 十六进制颜色",
        },
        {
          path: [0, 0],
          message: "text mark fontSize 的值必须是 8 到 72 之间的整数",
        },
        {
          path: [0, 0],
          message: "text mark textColor 的值必须是 #RGB 或 #RRGGBB 十六进制颜色",
        },
      ],
    });
  });

  it("rejects unsafe text color strings", () => {
    const result = validateDocument({
      children: [
        {
          children: [
            {
              marks: { textColor: "rgb(0, 0, 0)" },
              text: "unsafe",
              type: "text",
            },
          ],
          type: "paragraph",
        },
      ],
      type: "document",
    });

    expect(result).toEqual({
      errors: [
        {
          message: "text mark textColor 的值必须是 #RGB 或 #RRGGBB 十六进制颜色",
          path: [0, 0],
        },
      ],
      valid: false,
    });
  });

  it("rejects unsafe background color strings", () => {
    const result = validateDocument({
      children: [
        {
          children: [
            {
              marks: { backgroundColor: "rgba(255, 255, 0, 0.5)" },
              text: "unsafe",
              type: "text",
            },
          ],
          type: "paragraph",
        },
      ],
      type: "document",
    });

    expect(result).toEqual({
      errors: [
        {
          message: "text mark backgroundColor 的值必须是 #RGB 或 #RRGGBB 十六进制颜色",
          path: [0, 0],
        },
      ],
      valid: false,
    });
  });

  it("rejects unsafe link href and unsupported attributes", () => {
    const result = validateDocument({
      children: [
        {
          children: [
            {
              marks: { link: { href: "javascript:alert(1)" } },
              text: "unsafe",
              type: "text",
            },
            {
              marks: {
                link: {
                  href: "https://example.com",
                  rel: "sponsored",
                  target: "popup",
                },
              },
              text: "unsupported",
              type: "text",
            },
          ],
          type: "paragraph",
        },
      ],
      type: "document",
    });

    expect(result).toEqual({
      errors: [
        {
          message:
            "text mark link 必须包含安全 href，且 target 和 rel 必须使用受支持的值",
          path: [0, 0],
        },
        {
          message:
            "text mark link 必须包含安全 href，且 target 和 rel 必须使用受支持的值",
          path: [0, 1],
        },
      ],
      valid: false,
    });
  });

  it("rejects non-object text marks", () => {
    const result = validateDocument({
      type: "document",
      children: [
        { type: "paragraph", children: [{ type: "text", text: "x", marks: true }] },
      ],
    });

    expect(result).toEqual({
      valid: false,
      errors: [{ path: [0, 0], message: "text marks 必须是对象" }],
    });
  });

  it("rejects unsupported or non-true text marks", () => {
    const result = validateDocument({
      type: "document",
      children: [
        {
          type: "paragraph",
          children: [
            {
              type: "text",
              text: "x",
              marks: { bold: false, highlight: true },
            },
          ],
        },
      ],
    });

    expect(result).toEqual({
      valid: false,
      errors: [
        { path: [0, 0], message: "text mark bold 的值必须是 true" },
        { path: [0, 0], message: "text mark highlight 不受支持" },
      ],
    });
  });
});

import { describe, expect, it } from "vitest";

import {
  createDocument,
  createHeading,
  createParagraph,
  createText,
} from "../../src/model";
import {
  applySetLink,
  cloneOperation,
  createSelectionAfterSetLink,
  createSetLinkOperation,
  type SetLinkOperation,
} from "../../src/operation";

describe("set link operation", () => {
  it("creates a normalized operation with isolated values", () => {
    const anchorPath = [0, 0];
    const focusPath = [0, 0];
    const link = {
      href: " HTTPS://Example.com/docs ",
      rel: "NOFOLLOW noopener",
      target: "_blank" as const,
    };
    const operation = createSetLinkOperation(
      {
        anchor: { path: anchorPath, offset: 1 },
        focus: { path: focusPath, offset: 3 },
      },
      link,
    );

    anchorPath[0] = 9;
    focusPath[1] = 8;
    link.href = "https://changed.example.com";

    expect(operation).toEqual({
      link: {
        href: "https://example.com/docs",
        rel: "nofollow noopener",
        target: "_blank",
      },
      range: {
        anchor: { path: [0, 0], offset: 1 },
        focus: { path: [0, 0], offset: 3 },
      },
      type: "set_link",
    });
  });

  it("clones link attributes when cloning an operation", () => {
    const operation = createSetLinkOperation(
      {
        anchor: { path: [0, 0], offset: 0 },
        focus: { path: [0, 0], offset: 2 },
      },
      { href: "https://example.com" },
    );
    const cloned = cloneOperation(operation) as SetLinkOperation;

    operation.link!.href = "https://changed.example.com";
    operation.range.anchor.path[0] = 4;

    expect(cloned).toEqual({
      link: { href: "https://example.com/" },
      range: {
        anchor: { path: [0, 0], offset: 0 },
        focus: { path: [0, 0], offset: 2 },
      },
      type: "set_link",
    });
  });

  it("rejects unsafe links from constructors and raw operations", () => {
    const range = {
      anchor: { path: [0, 0], offset: 0 },
      focus: { path: [0, 0], offset: 2 },
    };
    const document = createDocument([createParagraph([createText("链接")])]);
    const unsafeOperation: SetLinkOperation = {
      link: { href: "javascript:alert(1)" },
      range,
      type: "set_link",
    };

    expect(() =>
      createSetLinkOperation(range, { href: "javascript:alert(1)" }),
    ).toThrow("invalid link mark");
    expect(() => applySetLink(document, unsafeOperation)).toThrow("invalid link mark");
  });

  it("sets a link on part of a text node and preserves other marks", () => {
    const document = createDocument([
      createParagraph([
        createText("你好世界", {
          bold: true,
          textColor: "#1677ff",
        }),
      ]),
    ]);
    const operation = createSetLinkOperation(
      {
        anchor: { path: [0, 0], offset: 1 },
        focus: { path: [0, 0], offset: 3 },
      },
      { href: "https://example.com/docs" },
    );
    const result = applySetLink(document, operation);

    expect(result.children[0]?.children).toEqual([
      {
        marks: { bold: true, textColor: "#1677ff" },
        text: "你",
        type: "text",
      },
      {
        marks: {
          bold: true,
          link: { href: "https://example.com/docs" },
          textColor: "#1677ff",
        },
        text: "好世",
        type: "text",
      },
      {
        marks: { bold: true, textColor: "#1677ff" },
        text: "界",
        type: "text",
      },
    ]);
    expect(document.children[0]?.children).toEqual([
      {
        marks: { bold: true, textColor: "#1677ff" },
        text: "你好世界",
        type: "text",
      },
    ]);
    expect(createSelectionAfterSetLink(document, operation)).toEqual({
      anchor: { path: [0, 1], offset: 0 },
      focus: { path: [0, 1], offset: 2 },
    });
  });

  it("overwrites links across sibling text nodes", () => {
    const document = createDocument([
      createParagraph([
        createText("访问", { link: { href: "https://old.example.com/" } }),
        createText("项目", {
          bold: true,
          link: { href: "https://other.example.com/" },
        }),
        createText("文档"),
      ]),
    ]);
    const operation = createSetLinkOperation(
      {
        anchor: { path: [0, 0], offset: 1 },
        focus: { path: [0, 2], offset: 1 },
      },
      {
        href: "https://example.com/guide",
        rel: "noopener noreferrer",
        target: "_blank",
      },
    );

    expect(applySetLink(document, operation).children[0]?.children).toEqual([
      {
        marks: { link: { href: "https://old.example.com/" } },
        text: "访",
        type: "text",
      },
      {
        marks: {
          link: {
            href: "https://example.com/guide",
            rel: "noopener noreferrer",
            target: "_blank",
          },
        },
        text: "问",
        type: "text",
      },
      {
        marks: {
          bold: true,
          link: {
            href: "https://example.com/guide",
            rel: "noopener noreferrer",
            target: "_blank",
          },
        },
        text: "项目",
        type: "text",
      },
      {
        marks: {
          link: {
            href: "https://example.com/guide",
            rel: "noopener noreferrer",
            target: "_blank",
          },
        },
        text: "文",
        type: "text",
      },
      { text: "档", type: "text" },
    ]);
    expect(createSelectionAfterSetLink(document, operation)).toEqual({
      anchor: { path: [0, 1], offset: 0 },
      focus: { path: [0, 3], offset: 1 },
    });
  });

  it("sets a link inside a heading", () => {
    const document = createDocument([createHeading(3, [createText("标题链接")])]);
    const operation = createSetLinkOperation(
      {
        anchor: { path: [0, 0], offset: 2 },
        focus: { path: [0, 0], offset: 4 },
      },
      { href: "https://example.com/heading" },
    );
    const result = applySetLink(document, operation);

    expect(result.children[0]).toMatchObject({ level: 3, type: "heading" });
    expect(result.children[0]?.children).toEqual([
      { text: "标题", type: "text" },
      {
        marks: { link: { href: "https://example.com/heading" } },
        text: "链接",
        type: "text",
      },
    ]);
  });

  it("removes links and merges compatible neighbors", () => {
    const document = createDocument([
      createParagraph([
        createText("前"),
        createText("链接", { link: { href: "https://example.com/" } }),
        createText("后"),
      ]),
    ]);
    const operation = createSetLinkOperation(
      {
        anchor: { path: [0, 1], offset: 0 },
        focus: { path: [0, 1], offset: 2 },
      },
      null,
    );

    expect(applySetLink(document, operation).children[0]?.children).toEqual([
      { text: "前链接后", type: "text" },
    ]);
    expect(createSelectionAfterSetLink(document, operation)).toEqual({
      anchor: { path: [0, 0], offset: 1 },
      focus: { path: [0, 0], offset: 3 },
    });
  });
});

import { describe, expect, it } from "vitest";

import { createDocument, createParagraph, createText } from "../../src/model";
import {
  applyToggleMark,
  createSelectionAfterToggleMark,
  createToggleMarkOperation,
} from "../../src/operation";

describe("createToggleMarkOperation", () => {
  it("creates a toggle mark operation from a range and mark", () => {
    expect(
      createToggleMarkOperation(
        {
          anchor: { path: [0, 0], offset: 1 },
          focus: { path: [0, 0], offset: 3 },
        },
        "bold",
      ),
    ).toEqual({
      mark: "bold",
      range: {
        anchor: { path: [0, 0], offset: 1 },
        focus: { path: [0, 0], offset: 3 },
      },
      type: "toggle_mark",
    });
  });

  it("clones range paths when creating the operation", () => {
    const anchorPath = [0, 0];
    const focusPath = [0, 0];
    const operation = createToggleMarkOperation(
      {
        anchor: { path: anchorPath, offset: 1 },
        focus: { path: focusPath, offset: 3 },
      },
      "bold",
    );

    anchorPath[0] = 9;
    focusPath[1] = 8;

    expect(operation.range.anchor.path).toEqual([0, 0]);
    expect(operation.range.focus.path).toEqual([0, 0]);
  });
});

describe("applyToggleMark", () => {
  it("toggles a selected range inside one text node", () => {
    const document = createDocument([createParagraph([createText("你好世界")])]);
    const result = applyToggleMark(
      document,
      createToggleMarkOperation(
        {
          anchor: { path: [0, 0], offset: 1 },
          focus: { path: [0, 0], offset: 3 },
        },
        "bold",
      ),
    );

    expect(result.children[0]?.children).toEqual([
      { type: "text", text: "你" },
      { type: "text", text: "好世", marks: { bold: true } },
      { type: "text", text: "界" },
    ]);
    expect(document.children[0]?.children).toEqual([
      { type: "text", text: "你好世界" },
    ]);
  });

  it("removes an existing selected mark", () => {
    const document = createDocument([
      createParagraph([createText("你好", { bold: true, italic: true })]),
    ]);
    const result = applyToggleMark(
      document,
      createToggleMarkOperation(
        {
          anchor: { path: [0, 0], offset: 0 },
          focus: { path: [0, 0], offset: 2 },
        },
        "bold",
      ),
    );

    expect(result.children[0]?.children[0]).toEqual({
      type: "text",
      text: "你好",
      marks: { italic: true },
    });
  });

  it("adds underline without removing other boolean marks", () => {
    const document = createDocument([
      createParagraph([
        createText("你好", {
          backgroundColor: "#fff4cc",
          bold: true,
          fontSize: 16,
          italic: true,
          link: { href: "https://example.com/docs" },
          strike: true,
          textColor: "#1c2520",
        }),
      ]),
    ]);
    const result = applyToggleMark(
      document,
      createToggleMarkOperation(
        {
          anchor: { path: [0, 0], offset: 0 },
          focus: { path: [0, 0], offset: 2 },
        },
        "underline",
      ),
    );

    expect(result.children[0]?.children[0]).toEqual({
      type: "text",
      text: "你好",
      marks: {
        backgroundColor: "#fff4cc",
        bold: true,
        fontSize: 16,
        italic: true,
        link: { href: "https://example.com/docs" },
        strike: true,
        textColor: "#1c2520",
        underline: true,
      },
    });
  });

  it("creates a collapsed marked placeholder for future input", () => {
    const document = createDocument([createParagraph([createText("你好世界")])]);
    const operation = createToggleMarkOperation(
      {
        anchor: { path: [0, 0], offset: 2 },
        focus: { path: [0, 0], offset: 2 },
      },
      "bold",
    );
    const result = applyToggleMark(document, operation);

    expect(result.children[0]?.children).toEqual([
      { type: "text", text: "你好" },
      { type: "text", text: "", marks: { bold: true } },
      { type: "text", text: "世界" },
    ]);
    expect(createSelectionAfterToggleMark(document, operation)).toEqual({
      anchor: { path: [0, 1], offset: 0 },
      focus: { path: [0, 1], offset: 0 },
    });
  });

  it("toggles a range across sibling text nodes", () => {
    const document = createDocument([
      createParagraph([createText("你好"), createText("世界"), createText("。")]),
    ]);
    const result = applyToggleMark(
      document,
      createToggleMarkOperation(
        {
          anchor: { path: [0, 0], offset: 1 },
          focus: { path: [0, 1], offset: 1 },
        },
        "bold",
      ),
    );

    expect(result.children[0]?.children).toEqual([
      { type: "text", text: "你" },
      { type: "text", text: "好世", marks: { bold: true } },
      { type: "text", text: "界。" },
    ]);
  });

  it("adds a mark uniformly across a mixed selection", () => {
    const document = createDocument([
      createParagraph([
        createText("你好"),
        createText("世界", { bold: true }),
        createText("结束"),
      ]),
    ]);
    const result = applyToggleMark(
      document,
      createToggleMarkOperation(
        {
          anchor: { path: [0, 0], offset: 1 },
          focus: { path: [0, 2], offset: 1 },
        },
        "bold",
      ),
    );

    expect(result.children[0]?.children).toEqual([
      { type: "text", text: "你" },
      { type: "text", text: "好世界结", marks: { bold: true } },
      { type: "text", text: "束" },
    ]);
  });

  it("removes a mark uniformly from a reverse selection", () => {
    const document = createDocument([
      createParagraph([
        createText("你好", { italic: true }),
        createText("世界", { bold: true, italic: true }),
        createText("结束", { italic: true }),
      ]),
    ]);
    const result = applyToggleMark(
      document,
      createToggleMarkOperation(
        {
          anchor: { path: [0, 2], offset: 1 },
          focus: { path: [0, 0], offset: 1 },
        },
        "italic",
      ),
    );

    expect(result.children[0]?.children).toEqual([
      { type: "text", text: "你", marks: { italic: true } },
      { type: "text", text: "好" },
      { type: "text", text: "世界", marks: { bold: true } },
      { type: "text", text: "结" },
      { type: "text", text: "束", marks: { italic: true } },
    ]);
  });

  it("maps selection across merged sibling text nodes", () => {
    const document = createDocument([
      createParagraph([
        createText("你"),
        createText("好"),
        createText("世"),
        createText("界"),
      ]),
    ]);
    const operation = createToggleMarkOperation(
      {
        anchor: { path: [0, 1], offset: 0 },
        focus: { path: [0, 2], offset: 1 },
      },
      "bold",
    );

    expect(createSelectionAfterToggleMark(document, operation)).toEqual({
      anchor: { path: [0, 1], offset: 0 },
      focus: { path: [0, 1], offset: 2 },
    });
  });

  it("maps selection after merging toggled text with neighboring marks", () => {
    const document = createDocument([
      createParagraph([
        createText("你", { bold: true }),
        createText("好"),
        createText("世界", { bold: true }),
      ]),
    ]);
    const operation = createToggleMarkOperation(
      {
        anchor: { path: [0, 1], offset: 0 },
        focus: { path: [0, 1], offset: 1 },
      },
      "bold",
    );

    expect(applyToggleMark(document, operation).children[0]?.children).toEqual([
      { type: "text", text: "你好世界", marks: { bold: true } },
    ]);
    expect(createSelectionAfterToggleMark(document, operation)).toEqual({
      anchor: { path: [0, 0], offset: 1 },
      focus: { path: [0, 0], offset: 2 },
    });
  });

  it("throws when a range crosses paragraphs", () => {
    const document = createDocument([
      createParagraph([createText("你好")]),
      createParagraph([createText("世界")]),
    ]);

    expect(() =>
      applyToggleMark(
        document,
        createToggleMarkOperation(
          {
            anchor: { path: [0, 0], offset: 0 },
            focus: { path: [1, 0], offset: 1 },
          },
          "bold",
        ),
      ),
    ).toThrow("toggle mark range must stay inside one paragraph");
  });
});

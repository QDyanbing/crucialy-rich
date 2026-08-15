import { describe, expect, it } from "vitest";

import { createDocument, createParagraph, createText } from "../../src/model";
import {
  applySetMarkAttribute,
  createSelectionAfterSetMarkAttribute,
  createSetMarkAttributeOperation,
  type SetMarkAttributeOperation,
} from "../../src/operation";

describe("set mark attribute operation", () => {
  it("creates an operation with cloned range paths", () => {
    const anchorPath = [0, 0];
    const focusPath = [0, 0];
    const operation = createSetMarkAttributeOperation(
      {
        anchor: { path: anchorPath, offset: 1 },
        focus: { path: focusPath, offset: 3 },
      },
      "fontSize",
      18,
    );

    anchorPath[0] = 9;
    focusPath[1] = 8;

    expect(operation).toEqual({
      attribute: "fontSize",
      range: {
        anchor: { path: [0, 0], offset: 1 },
        focus: { path: [0, 0], offset: 3 },
      },
      type: "set_mark_attribute",
      value: 18,
    });
  });

  it("sets a font size on part of one text node", () => {
    const document = createDocument([
      createParagraph([createText("你好世界", { bold: true })]),
    ]);
    const result = applySetMarkAttribute(
      document,
      createSetMarkAttributeOperation(
        {
          anchor: { path: [0, 0], offset: 1 },
          focus: { path: [0, 0], offset: 3 },
        },
        "fontSize",
        18,
      ),
    );

    expect(result.children[0]?.children).toEqual([
      { marks: { bold: true }, text: "你", type: "text" },
      { marks: { bold: true, fontSize: 18 }, text: "好世", type: "text" },
      { marks: { bold: true }, text: "界", type: "text" },
    ]);
    expect(document.children[0]?.children).toEqual([
      { marks: { bold: true }, text: "你好世界", type: "text" },
    ]);
  });

  it("overwrites an existing font size while preserving other marks", () => {
    const document = createDocument([
      createParagraph([
        createText("字号", {
          bold: true,
          fontSize: 16,
          textColor: "#1677ff",
        }),
      ]),
    ]);
    const result = applySetMarkAttribute(
      document,
      createSetMarkAttributeOperation(
        {
          anchor: { path: [0, 0], offset: 0 },
          focus: { path: [0, 0], offset: 2 },
        },
        "fontSize",
        24,
      ),
    );

    expect(result.children[0]?.children[0]?.marks).toEqual({
      bold: true,
      fontSize: 24,
      textColor: "#1677ff",
    });
  });

  it("removes a font size without removing other marks", () => {
    const document = createDocument([
      createParagraph([
        createText("字号", {
          bold: true,
          fontSize: 18,
          textColor: "#1677ff",
        }),
      ]),
    ]);
    const result = applySetMarkAttribute(
      document,
      createSetMarkAttributeOperation(
        {
          anchor: { path: [0, 0], offset: 0 },
          focus: { path: [0, 0], offset: 2 },
        },
        "fontSize",
        null,
      ),
    );

    expect(result.children[0]?.children[0]?.marks).toEqual({
      bold: true,
      textColor: "#1677ff",
    });
  });

  it("rejects unsupported attribute values", () => {
    const range = {
      anchor: { path: [0, 0], offset: 0 },
      focus: { path: [0, 0], offset: 1 },
    };
    const document = createDocument([createParagraph([createText("字号")])]);
    const invalidOperation: SetMarkAttributeOperation<"fontSize"> = {
      attribute: "fontSize",
      range,
      type: "set_mark_attribute",
      value: 100,
    };

    expect(() => createSetMarkAttributeOperation(range, "fontSize", 100)).toThrow(
      "invalid fontSize mark value",
    );
    expect(() => applySetMarkAttribute(document, invalidOperation)).toThrow(
      "invalid fontSize mark value",
    );
  });

  it("creates a collapsed placeholder for later input", () => {
    const document = createDocument([
      createParagraph([createText("你好世界", { bold: true })]),
    ]);
    const operation = createSetMarkAttributeOperation(
      {
        anchor: { path: [0, 0], offset: 2 },
        focus: { path: [0, 0], offset: 2 },
      },
      "fontSize",
      18,
    );

    expect(applySetMarkAttribute(document, operation).children[0]?.children).toEqual([
      { marks: { bold: true }, text: "你好", type: "text" },
      { marks: { bold: true, fontSize: 18 }, text: "", type: "text" },
      { marks: { bold: true }, text: "世界", type: "text" },
    ]);
    expect(createSelectionAfterSetMarkAttribute(document, operation)).toEqual({
      anchor: { path: [0, 1], offset: 0 },
      focus: { path: [0, 1], offset: 0 },
    });
  });

  it("maps a selection after updating sibling text nodes", () => {
    const document = createDocument([
      createParagraph([
        createText("你"),
        createText("好"),
        createText("世"),
        createText("界"),
      ]),
    ]);
    const operation = createSetMarkAttributeOperation(
      {
        anchor: { path: [0, 1], offset: 0 },
        focus: { path: [0, 2], offset: 1 },
      },
      "fontSize",
      18,
    );

    expect(applySetMarkAttribute(document, operation).children[0]?.children).toEqual([
      { text: "你", type: "text" },
      { marks: { fontSize: 18 }, text: "好世", type: "text" },
      { text: "界", type: "text" },
    ]);
    expect(createSelectionAfterSetMarkAttribute(document, operation)).toEqual({
      anchor: { path: [0, 1], offset: 0 },
      focus: { path: [0, 1], offset: 2 },
    });
  });

  it("maps a selection after removing a size and merging neighbors", () => {
    const document = createDocument([
      createParagraph([
        createText("你"),
        createText("好", { fontSize: 18 }),
        createText("世界"),
      ]),
    ]);
    const operation = createSetMarkAttributeOperation(
      {
        anchor: { path: [0, 1], offset: 0 },
        focus: { path: [0, 1], offset: 1 },
      },
      "fontSize",
      null,
    );

    expect(applySetMarkAttribute(document, operation).children[0]?.children).toEqual([
      { text: "你好世界", type: "text" },
    ]);
    expect(createSelectionAfterSetMarkAttribute(document, operation)).toEqual({
      anchor: { path: [0, 0], offset: 1 },
      focus: { path: [0, 0], offset: 2 },
    });
  });

  it("rejects a range that crosses paragraphs", () => {
    const document = createDocument([
      createParagraph([createText("第一段")]),
      createParagraph([createText("第二段")]),
    ]);
    const operation = createSetMarkAttributeOperation(
      {
        anchor: { path: [0, 0], offset: 0 },
        focus: { path: [1, 0], offset: 1 },
      },
      "fontSize",
      18,
    );

    expect(() => applySetMarkAttribute(document, operation)).toThrow(
      "set mark attribute range must stay inside one paragraph",
    );
    expect(() => createSelectionAfterSetMarkAttribute(document, operation)).toThrow(
      "set mark attribute range must stay inside one paragraph",
    );
  });

  it("sets and sanitizes text color while preserving other marks", () => {
    const document = createDocument([
      createParagraph([
        createText("颜色", {
          bold: true,
          fontSize: 18,
        }),
      ]),
    ]);
    const operation = createSetMarkAttributeOperation(
      {
        anchor: { path: [0, 0], offset: 0 },
        focus: { path: [0, 0], offset: 2 },
      },
      "textColor",
      "#0AF",
    );

    expect(applySetMarkAttribute(document, operation).children[0]?.children[0]).toEqual(
      {
        marks: {
          bold: true,
          fontSize: 18,
          textColor: "#00aaff",
        },
        text: "颜色",
        type: "text",
      },
    );
  });

  it("removes text color across sibling nodes", () => {
    const document = createDocument([
      createParagraph([
        createText("文", { bold: true, textColor: "#1677ff" }),
        createText("字", { textColor: "#1677ff" }),
      ]),
    ]);
    const operation = createSetMarkAttributeOperation(
      {
        anchor: { path: [0, 0], offset: 0 },
        focus: { path: [0, 1], offset: 1 },
      },
      "textColor",
      null,
    );

    expect(applySetMarkAttribute(document, operation).children[0]?.children).toEqual([
      { marks: { bold: true }, text: "文", type: "text" },
      { text: "字", type: "text" },
    ]);
  });

  it("rejects unsafe text color operations", () => {
    const range = {
      anchor: { path: [0, 0], offset: 0 },
      focus: { path: [0, 0], offset: 2 },
    };
    const document = createDocument([createParagraph([createText("颜色")])]);
    const unsafeOperation: SetMarkAttributeOperation<"textColor"> = {
      attribute: "textColor",
      range,
      type: "set_mark_attribute",
      value: "#fff; display: none",
    };

    expect(() =>
      createSetMarkAttributeOperation(range, "textColor", "rgb(0, 0, 0)"),
    ).toThrow("invalid textColor mark value");
    expect(() => applySetMarkAttribute(document, unsafeOperation)).toThrow(
      "invalid textColor mark value",
    );
    expect(document.children[0]?.children[0]).toEqual({
      text: "颜色",
      type: "text",
    });
  });
});

import { describe, expect, it } from "vitest";

import { createDocument, createParagraph, createText } from "../../src/model";
import {
  applySetMarkAttribute,
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
});

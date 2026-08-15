import { describe, expect, it } from "vitest";

import {
  applyTransaction,
  canExecuteSetTextColorCommand,
  createDocument,
  createParagraph,
  createText,
  insertTextCommand,
  setTextColorCommand,
} from "../../src";

describe("setTextColorCommand", () => {
  it("sets a sanitized color on a selected range", () => {
    const document = createDocument([createParagraph([createText("你好世界")])]);
    const input = {
      context: {
        document,
        selection: {
          anchor: { path: [0, 0], offset: 1 },
          focus: { path: [0, 0], offset: 3 },
        },
      },
      payload: { textColor: "#0AF" },
    };
    const result = setTextColorCommand.execute(input);

    expect(canExecuteSetTextColorCommand(input)).toBe(true);
    expect(result.ok).toBe(true);
    expect(result.transaction?.operations).toEqual([
      {
        attribute: "textColor",
        range: {
          anchor: { path: [0, 0], offset: 1 },
          focus: { path: [0, 0], offset: 3 },
        },
        type: "set_mark_attribute",
        value: "#00aaff",
      },
    ]);
    expect(
      applyTransaction(document, result.transaction!).children[0]?.children,
    ).toEqual([
      { text: "你", type: "text" },
      { marks: { textColor: "#00aaff" }, text: "好世", type: "text" },
      { text: "界", type: "text" },
    ]);
    expect(result.selection).toEqual({
      anchor: { path: [0, 1], offset: 0 },
      focus: { path: [0, 1], offset: 2 },
    });
  });

  it("sets color across sibling nodes while preserving other marks", () => {
    const document = createDocument([
      createParagraph([
        createText("你", { fontSize: 18 }),
        createText("好", { bold: true, fontSize: 18 }),
        createText("世界", { fontSize: 18 }),
      ]),
    ]);
    const result = setTextColorCommand.execute({
      context: {
        document,
        selection: {
          anchor: { path: [0, 2], offset: 1 },
          focus: { path: [0, 0], offset: 0 },
        },
      },
      payload: { textColor: "#1677FF" },
    });

    expect(
      applyTransaction(document, result.transaction!).children[0]?.children,
    ).toEqual([
      {
        marks: { fontSize: 18, textColor: "#1677ff" },
        text: "你",
        type: "text",
      },
      {
        marks: { bold: true, fontSize: 18, textColor: "#1677ff" },
        text: "好",
        type: "text",
      },
      {
        marks: { fontSize: 18, textColor: "#1677ff" },
        text: "世",
        type: "text",
      },
      { marks: { fontSize: 18 }, text: "界", type: "text" },
    ]);
  });

  it("uses a collapsed colored placeholder for later input", () => {
    const document = createDocument([createParagraph([createText("你好世界")])]);
    const colorResult = setTextColorCommand.execute({
      context: {
        document,
        selection: {
          anchor: { path: [0, 0], offset: 2 },
          focus: { path: [0, 0], offset: 2 },
        },
      },
      payload: { textColor: "#1677ff" },
    });
    const coloredDocument = applyTransaction(document, colorResult.transaction!);

    if (!colorResult.selection) {
      throw new Error("Set text color command should return a selection.");
    }

    const insertResult = insertTextCommand.execute({
      context: {
        document: coloredDocument,
        selection: colorResult.selection,
      },
      payload: { text: "蓝" },
    });

    expect(
      applyTransaction(coloredDocument, insertResult.transaction!).children[0]
        ?.children,
    ).toEqual([
      { text: "你好", type: "text" },
      { marks: { textColor: "#1677ff" }, text: "蓝", type: "text" },
      { text: "世界", type: "text" },
    ]);
  });
});

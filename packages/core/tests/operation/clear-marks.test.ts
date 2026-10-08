import { describe, expect, it } from "vitest";

import { createDocument, createParagraph, createText } from "../../src/model";
import {
  applyClearMarks,
  cloneOperation,
  createClearMarksOperation,
  createSelectionAfterClearMarks,
} from "../../src/operation";

describe("clear marks operation", () => {
  it("clones the input range", () => {
    const anchorPath = [0, 0];
    const focusPath = [0, 0];
    const operation = createClearMarksOperation({
      anchor: { path: anchorPath, offset: 1 },
      focus: { path: focusPath, offset: 3 },
    });

    anchorPath[0] = 4;
    focusPath[1] = 5;

    expect(operation).toEqual({
      range: {
        anchor: { path: [0, 0], offset: 1 },
        focus: { path: [0, 0], offset: 3 },
      },
      type: "clear_marks",
    });
    expect(cloneOperation(operation)).toEqual(operation);
  });

  it("clears every mark from the selected text only", () => {
    const document = createDocument([
      createParagraph([
        createText("你好世界", {
          backgroundColor: "#fff2e8",
          bold: true,
          fontSize: 18,
          italic: true,
          link: { href: "https://example.com/" },
          textColor: "#1677ff",
        }),
      ]),
    ]);
    const operation = createClearMarksOperation({
      anchor: { path: [0, 0], offset: 1 },
      focus: { path: [0, 0], offset: 3 },
    });

    expect(applyClearMarks(document, operation).children[0]?.children).toEqual([
      {
        marks: {
          backgroundColor: "#fff2e8",
          bold: true,
          fontSize: 18,
          italic: true,
          link: { href: "https://example.com/" },
          textColor: "#1677ff",
        },
        text: "你",
        type: "text",
      },
      { text: "好世", type: "text" },
      {
        marks: {
          backgroundColor: "#fff2e8",
          bold: true,
          fontSize: 18,
          italic: true,
          link: { href: "https://example.com/" },
          textColor: "#1677ff",
        },
        text: "界",
        type: "text",
      },
    ]);
    expect(createSelectionAfterClearMarks(document, operation)).toEqual({
      anchor: { path: [0, 1], offset: 0 },
      focus: { path: [0, 1], offset: 2 },
    });
  });

  it("merges cleared text across sibling nodes and restores its selection", () => {
    const document = createDocument([
      createParagraph([
        createText("甲乙", { bold: true }),
        createText("丙丁", { italic: true }),
        createText("戊己", { textColor: "#1677ff" }),
      ]),
    ]);
    const operation = createClearMarksOperation({
      anchor: { path: [0, 0], offset: 1 },
      focus: { path: [0, 2], offset: 1 },
    });

    expect(applyClearMarks(document, operation).children[0]?.children).toEqual([
      { marks: { bold: true }, text: "甲", type: "text" },
      { text: "乙丙丁戊", type: "text" },
      { marks: { textColor: "#1677ff" }, text: "己", type: "text" },
    ]);
    expect(createSelectionAfterClearMarks(document, operation)).toEqual({
      anchor: { path: [0, 1], offset: 0 },
      focus: { path: [0, 1], offset: 4 },
    });
  });

  it("creates a plain collapsed placeholder for following input", () => {
    const document = createDocument([
      createParagraph([createText("样式文字", { bold: true, fontSize: 20 })]),
    ]);
    const operation = createClearMarksOperation({
      anchor: { path: [0, 0], offset: 2 },
      focus: { path: [0, 0], offset: 2 },
    });

    expect(applyClearMarks(document, operation).children[0]?.children).toEqual([
      {
        marks: { bold: true, fontSize: 20 },
        text: "样式",
        type: "text",
      },
      { text: "", type: "text" },
      {
        marks: { bold: true, fontSize: 20 },
        text: "文字",
        type: "text",
      },
    ]);
    expect(createSelectionAfterClearMarks(document, operation)).toEqual({
      anchor: { path: [0, 1], offset: 0 },
      focus: { path: [0, 1], offset: 0 },
    });
  });
});

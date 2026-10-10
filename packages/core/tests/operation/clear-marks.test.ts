import { describe, expect, it } from "vitest";

import {
  createDocument,
  createListItem,
  createOrderedList,
  createParagraph,
  createTableCell,
  createTableRow,
  createText,
  isListNode,
  isTableNode,
} from "../../src/model";
import {
  applyClearMarks,
  cloneOperation,
  createClearMarksOperation,
  createSelectionAfterClearMarks,
} from "../../src/operation";

describe("clear marks operation", () => {
  it("clears all marks inside a list item", () => {
    const document = createDocument([
      createOrderedList([
        createListItem([
          createText("列表格式", {
            bold: true,
            fontSize: 20,
            link: { href: "https://example.com/" },
          }),
        ]),
      ]),
    ]);
    const operation = createClearMarksOperation({
      anchor: { path: [0, 0, 0], offset: 2 },
      focus: { path: [0, 0, 0], offset: 4 },
    });
    const result = applyClearMarks(document, operation);
    const list = result.children[0];

    if (!isListNode(list)) {
      throw new Error("Expected an ordered list result.");
    }

    expect(list.children[0]?.children).toEqual([
      {
        marks: {
          bold: true,
          fontSize: 20,
          link: { href: "https://example.com/" },
        },
        text: "列表",
        type: "text",
      },
      { text: "格式", type: "text" },
    ]);
    expect(createSelectionAfterClearMarks(document, operation)).toEqual({
      anchor: { path: [0, 0, 1], offset: 0 },
      focus: { path: [0, 0, 1], offset: 2 },
    });
  });

  it("clears all marks inside one table paragraph", () => {
    const document = createDocument([
      {
        children: [
          createTableRow([
            createTableCell([
              createParagraph([
                createText("单元格格式", {
                  backgroundColor: "#fff2e8",
                  italic: true,
                  textColor: "#1677ff",
                }),
              ]),
            ]),
          ]),
        ],
        type: "table",
      },
    ]);
    const operation = createClearMarksOperation({
      anchor: { path: [0, 0, 0, 0, 0], offset: 3 },
      focus: { path: [0, 0, 0, 0, 0], offset: 5 },
    });
    const result = applyClearMarks(document, operation);
    const table = result.children[0];

    if (!isTableNode(table)) {
      throw new Error("Expected a table result.");
    }

    expect(table.children[0]?.children[0]?.children[0]?.children).toEqual([
      {
        marks: {
          backgroundColor: "#fff2e8",
          italic: true,
          textColor: "#1677ff",
        },
        text: "单元格",
        type: "text",
      },
      { text: "格式", type: "text" },
    ]);
    expect(createSelectionAfterClearMarks(document, operation)).toEqual({
      anchor: { path: [0, 0, 0, 0, 1], offset: 0 },
      focus: { path: [0, 0, 0, 0, 1], offset: 2 },
    });
  });

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

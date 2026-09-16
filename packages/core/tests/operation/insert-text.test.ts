import { describe, expect, it } from "vitest";

import {
  createBulletList,
  createDocument,
  createListItem,
  createParagraph,
  createText,
  createTaskItem,
  createTaskList,
  createTable,
} from "../../src/model";
import {
  applyInsertText,
  createInsertTextOperation,
  createSelectionAfterInsertText,
} from "../../src/operation";

describe("createInsertTextOperation", () => {
  it("inserts text in nested task items", () => {
    const document = createDocument([
      createTaskList([
        createTaskItem(
          [createText("父")],
          false,
          createTaskList([createTaskItem([createText("子项")])]),
        ),
      ]),
    ]);
    const result = applyInsertText(
      document,
      createInsertTextOperation({ offset: 1, path: [0, 0, 1, 0, 0] }, "任务"),
    );

    expect(result.children[0]).toMatchObject({
      children: [{ nested: { children: [{ children: [{ text: "子任务项" }] }] } }],
    });
  });

  it("creates an insert text operation from a point and text", () => {
    expect(
      createInsertTextOperation(
        {
          path: [0, 0],
          offset: 2,
        },
        "你好",
      ),
    ).toEqual({
      point: {
        path: [0, 0],
        offset: 2,
      },
      text: "你好",
      type: "insert_text",
    });
  });

  it("clones the point path when creating the operation", () => {
    const path = [0, 0];
    const operation = createInsertTextOperation({ path, offset: 1 }, "x");

    path[0] = 9;

    expect(operation.point.path).toEqual([0, 0]);
  });
});

describe("applyInsertText", () => {
  it("inserts text inside a table cell paragraph", () => {
    const table = createTable(1, 1);
    table.children[0]!.children[0]!.children[0]!.children[0]!.text = "单元格";
    const document = createDocument([table]);
    const result = applyInsertText(
      document,
      createInsertTextOperation({ offset: 2, path: [0, 0, 0, 0, 0] }, "内"),
    );
    const resultTable = result.children[0];

    expect(
      resultTable?.type === "table"
        ? resultTable.children[0]?.children[0]?.children[0]?.children[0]?.text
        : undefined,
    ).toBe("单元内格");
    expect(table.children[0]!.children[0]!.children[0]!.children[0]!.text).toBe(
      "单元格",
    );
  });

  it("inserts text inside a list item", () => {
    const document = createDocument([
      createBulletList([createListItem([createText("项目")])]),
    ]);
    const operation = createInsertTextOperation({ offset: 1, path: [0, 0, 0] }, "新");

    expect(applyInsertText(document, operation)).toEqual(
      createDocument([createBulletList([createListItem([createText("项新目")])])]),
    );
  });

  it("inserts text at the start of a text node", () => {
    const document = createDocument([createParagraph([createText("世界")])]);
    const result = applyInsertText(
      document,
      createInsertTextOperation(
        {
          path: [0, 0],
          offset: 0,
        },
        "你好，",
      ),
    );

    expect(result.children[0]?.children[0]?.text).toBe("你好，世界");
    expect(document.children[0]?.children[0]?.text).toBe("世界");
  });

  it("inserts text in the middle of a text node", () => {
    const document = createDocument([createParagraph([createText("你好世界")])]);
    const result = applyInsertText(
      document,
      createInsertTextOperation(
        {
          path: [0, 0],
          offset: 2,
        },
        "，",
      ),
    );

    expect(result.children[0]?.children[0]?.text).toBe("你好，世界");
  });

  it("inserts text at the end of a text node", () => {
    const document = createDocument([createParagraph([createText("你好")])]);
    const result = applyInsertText(
      document,
      createInsertTextOperation(
        {
          path: [0, 0],
          offset: 2,
        },
        "，crucialy-rich。",
      ),
    );

    expect(result.children[0]?.children[0]?.text).toBe("你好，crucialy-rich。");
  });

  it("preserves marks on the inserted text node", () => {
    const document = createDocument([
      createParagraph([
        createText("你好", {
          bold: true,
          link: { href: "https://example.com/docs" },
        }),
      ]),
    ]);
    const result = applyInsertText(
      document,
      createInsertTextOperation(
        {
          path: [0, 0],
          offset: 1,
        },
        "，",
      ),
    );

    expect(result.children[0]?.children[0]?.marks).toEqual({
      bold: true,
      link: { href: "https://example.com/docs" },
    });
  });

  it("throws when the point path does not reference text", () => {
    const document = createDocument([createParagraph([createText("你好")])]);

    expect(() =>
      applyInsertText(
        document,
        createInsertTextOperation(
          {
            path: [0],
            offset: 0,
          },
          "x",
        ),
      ),
    ).toThrow(RangeError);
  });

  it("throws when the point offset is outside text", () => {
    const document = createDocument([createParagraph([createText("你好")])]);

    expect(() =>
      applyInsertText(
        document,
        createInsertTextOperation(
          {
            path: [0, 0],
            offset: 3,
          },
          "x",
        ),
      ),
    ).toThrow("insert text point must reference a text node");
  });

  it("keeps the same document reference when inserted text is empty", () => {
    const document = createDocument([createParagraph([createText("你好")])]);
    const result = applyInsertText(
      document,
      createInsertTextOperation(
        {
          path: [0, 0],
          offset: 1,
        },
        "",
      ),
    );

    expect(result).toBe(document);
  });
});

describe("createSelectionAfterInsertText", () => {
  it("creates a collapsed selection after the inserted text", () => {
    const operation = createInsertTextOperation(
      {
        path: [0, 0],
        offset: 2,
      },
      "abc",
    );

    expect(createSelectionAfterInsertText(operation)).toEqual({
      anchor: {
        path: [0, 0],
        offset: 5,
      },
      focus: {
        path: [0, 0],
        offset: 5,
      },
    });
  });
});

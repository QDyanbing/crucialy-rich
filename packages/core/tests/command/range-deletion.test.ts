import { describe, expect, it } from "vitest";

import { createDivider, createDocument, createParagraph, createText } from "../../src";
import { createRangeDeletionPlan } from "../../src/command/range-deletion";

describe("createRangeDeletionPlan", () => {
  it("plans a normalized deletion inside one text container", () => {
    const document = createDocument([
      createParagraph([createText("开头"), createText("结尾", { bold: true })]),
    ]);
    const plan = createRangeDeletionPlan(document, {
      anchor: { offset: 1, path: [0, 1] },
      focus: { offset: 1, path: [0, 0] },
    });

    expect(plan).toEqual({
      operation: {
        range: {
          anchor: { offset: 1, path: [0, 0] },
          focus: { offset: 1, path: [0, 1] },
        },
        type: "delete_text",
      },
      selection: {
        anchor: { offset: 1, path: [0, 0] },
        focus: { offset: 1, path: [0, 0] },
      },
    });
  });

  it("plans a deletion across continuous top-level text blocks", () => {
    const document = createDocument([
      createParagraph([createText("第一段")]),
      createParagraph([createText("第二段")]),
    ]);
    const plan = createRangeDeletionPlan(document, {
      anchor: { offset: 1, path: [0, 0] },
      focus: { offset: 1, path: [1, 0] },
    });

    expect(plan?.operation.type).toBe("delete_range");
    expect(plan?.selection).toEqual({
      anchor: { offset: 1, path: [0, 0] },
      focus: { offset: 1, path: [0, 0] },
    });
  });

  it("rejects collapsed and structural ranges", () => {
    const document = createDocument([
      createParagraph([createText("开头")]),
      createDivider(),
      createParagraph([createText("结尾")]),
    ]);

    expect(
      createRangeDeletionPlan(document, {
        anchor: { offset: 1, path: [0, 0] },
        focus: { offset: 1, path: [0, 0] },
      }),
    ).toBeUndefined();
    expect(
      createRangeDeletionPlan(document, {
        anchor: { offset: 0, path: [0, 0] },
        focus: { offset: 1, path: [2, 0] },
      }),
    ).toBeUndefined();
  });
});

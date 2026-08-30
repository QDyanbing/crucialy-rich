import { describe, expect, it } from "vitest";

import { createSelectedBlockTypeCommandSuccess } from "../../src/command/block-type-result";
import { createDocument, createParagraph, createText } from "../../src/model";

describe("createSelectedBlockTypeCommandSuccess", () => {
  it("creates one operation per selected block and clones the selection", () => {
    const document = createDocument([
      createParagraph([createText("第一段")]),
      createParagraph([createText("第二段")]),
    ]);
    const selection = {
      anchor: { path: [1, 0], offset: 2 },
      focus: { path: [0, 0], offset: 1 },
    };
    const result = createSelectedBlockTypeCommandSuccess(
      "setExampleBlockType",
      { context: { document, selection } },
      { level: 2, type: "heading" },
    );

    expect(result?.transaction?.operations).toEqual([
      {
        block: { level: 2, type: "heading" },
        path: [0],
        type: "set_block_type",
      },
      {
        block: { level: 2, type: "heading" },
        path: [1],
        type: "set_block_type",
      },
    ]);
    expect(result?.selection).toEqual(selection);
    expect(result?.selection).not.toBe(selection);
    expect(result?.selection?.anchor.path).not.toBe(selection.anchor.path);
  });

  it("returns undefined for a missing or invalid selection", () => {
    const document = createDocument([createParagraph([createText("正文")])]);

    expect(
      createSelectedBlockTypeCommandSuccess(
        "setExampleBlockType",
        { context: { document } },
        { type: "quote" },
      ),
    ).toBeUndefined();
    expect(
      createSelectedBlockTypeCommandSuccess(
        "setExampleBlockType",
        {
          context: {
            document,
            selection: {
              anchor: { path: [0, 0], offset: 3 },
              focus: { path: [0, 0], offset: 3 },
            },
          },
        },
        { type: "quote" },
      ),
    ).toBeUndefined();
  });
});

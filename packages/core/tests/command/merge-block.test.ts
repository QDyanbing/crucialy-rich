import { describe, expect, it } from "vitest";

import {
  applyTransaction,
  canExecuteMergeBlockCommand,
  createDocument,
  createParagraph,
  createText,
  mergeBlockCommand,
} from "../../src";

describe("mergeBlockCommand", () => {
  it("merges a paragraph into the previous paragraph", () => {
    const document = createDocument([
      createParagraph([createText("你好")]),
      createParagraph([createText("世界")]),
    ]);
    const input = {
      context: {
        document,
        selection: {
          anchor: { path: [1, 0], offset: 0 },
          focus: { path: [1, 0], offset: 0 },
        },
      },
    };
    const result = mergeBlockCommand.execute(input);

    expect(canExecuteMergeBlockCommand(input)).toBe(true);
    expect(result).toMatchObject({
      commandName: "mergeBlock",
      ok: true,
      selection: {
        anchor: { path: [0, 0], offset: 2 },
        focus: { path: [0, 0], offset: 2 },
      },
      status: "success",
    });
    expect(result.transaction).toEqual({
      operations: [
        {
          point: { path: [1, 0], offset: 0 },
          type: "merge_block",
        },
      ],
    });

    const nextDocument = applyTransaction(document, result.transaction!);

    expect(nextDocument.children).toHaveLength(1);
    expect(nextDocument.children[0]?.children.map((node) => node.text)).toEqual([
      "你好",
      "世界",
    ]);
  });

  it("skips first paragraph selections", () => {
    const document = createDocument([createParagraph([createText("你好")])]);
    const input = {
      context: {
        document,
        selection: {
          anchor: { path: [0, 0], offset: 0 },
          focus: { path: [0, 0], offset: 0 },
        },
      },
    };

    expect(canExecuteMergeBlockCommand(input)).toBe(false);
    expect(mergeBlockCommand.execute(input)).toEqual({
      commandName: "mergeBlock",
      ok: false,
      reason: "Merge block command requires the start of a non-first block.",
      status: "skipped",
    });
  });

  it("skips non-collapsed selections", () => {
    const document = createDocument([
      createParagraph([createText("你好")]),
      createParagraph([createText("世界")]),
    ]);
    const input = {
      context: {
        document,
        selection: {
          anchor: { path: [1, 0], offset: 0 },
          focus: { path: [1, 0], offset: 1 },
        },
      },
    };

    expect(canExecuteMergeBlockCommand(input)).toBe(false);
    expect(mergeBlockCommand.execute(input).status).toBe("skipped");
  });
});

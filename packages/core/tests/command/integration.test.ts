import { describe, expect, it } from "vitest";

import {
  applyTransaction,
  BOLD_COMMAND_NAME,
  createDefaultCommandRegistry,
  createDocument,
  createParagraph,
  createText,
  DELETE_SELECTION_COMMAND_NAME,
  executeCommand,
  INSERT_TEXT_COMMAND_NAME,
  ITALIC_COMMAND_NAME,
  MERGE_BLOCK_COMMAND_NAME,
  SPLIT_BLOCK_COMMAND_NAME,
} from "../../src";

describe("default command registry integration", () => {
  it("executes text and block commands through one registry", () => {
    const registry = createDefaultCommandRegistry();
    const document = createDocument([
      createParagraph([createText("你好")]),
      createParagraph([createText("第二段")]),
    ]);

    const inserted = executeCommand(registry, INSERT_TEXT_COMMAND_NAME, {
      context: {
        document,
        selection: {
          anchor: { path: [0, 0], offset: 2 },
          focus: { path: [0, 0], offset: 2 },
        },
      },
      payload: { text: "世界" },
    });

    expect(inserted.ok).toBe(true);
    expect(
      applyTransaction(document, inserted.transaction!).children[0]?.children[0]?.text,
    ).toBe("你好世界");

    const deleted = executeCommand(registry, DELETE_SELECTION_COMMAND_NAME, {
      context: {
        document,
        selection: {
          anchor: { path: [0, 0], offset: 0 },
          focus: { path: [0, 0], offset: 1 },
        },
      },
    });

    expect(deleted.ok).toBe(true);
    expect(deleted.transaction?.operations[0]?.type).toBe("delete_text");

    const split = executeCommand(registry, SPLIT_BLOCK_COMMAND_NAME, {
      context: {
        document,
        selection: {
          anchor: { path: [0, 0], offset: 1 },
          focus: { path: [0, 0], offset: 1 },
        },
      },
    });

    expect(split.ok).toBe(true);
    expect(split.transaction?.operations[0]?.type).toBe("split_block");

    const merged = executeCommand(registry, MERGE_BLOCK_COMMAND_NAME, {
      context: {
        document,
        selection: {
          anchor: { path: [1, 0], offset: 0 },
          focus: { path: [1, 0], offset: 0 },
        },
      },
    });

    expect(merged.ok).toBe(true);
    expect(merged.transaction?.operations[0]?.type).toBe("merge_block");

    const bolded = executeCommand(registry, BOLD_COMMAND_NAME, {
      context: {
        document,
        selection: {
          anchor: { path: [0, 0], offset: 0 },
          focus: { path: [0, 0], offset: 1 },
        },
      },
    });

    expect(bolded.ok).toBe(true);
    expect(bolded.transaction?.operations[0]).toMatchObject({
      mark: "bold",
      type: "toggle_mark",
    });

    const italicized = executeCommand(registry, ITALIC_COMMAND_NAME, {
      context: {
        document,
        selection: {
          anchor: { path: [0, 0], offset: 0 },
          focus: { path: [0, 0], offset: 1 },
        },
      },
    });

    expect(italicized.ok).toBe(true);
    expect(italicized.transaction?.operations[0]).toMatchObject({
      mark: "italic",
      type: "toggle_mark",
    });
  });
});

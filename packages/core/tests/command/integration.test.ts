import { describe, expect, it } from "vitest";

import {
  applyTransaction,
  BOLD_COMMAND_NAME,
  createDefaultCommandRegistry,
  createDocument,
  createHeading,
  createParagraph,
  createQuote,
  createText,
  DELETE_SELECTION_COMMAND_NAME,
  executeCommand,
  INSERT_TEXT_COMMAND_NAME,
  ITALIC_COMMAND_NAME,
  MERGE_BLOCK_COMMAND_NAME,
  SET_BACKGROUND_COLOR_COMMAND_NAME,
  SET_FONT_SIZE_COMMAND_NAME,
  SET_HEADING_COMMAND_NAME,
  SET_TEXT_COLOR_COMMAND_NAME,
  SPLIT_BLOCK_COMMAND_NAME,
  STRIKE_COMMAND_NAME,
  TOGGLE_QUOTE_COMMAND_NAME,
  UNDERLINE_COMMAND_NAME,
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

    const underlined = executeCommand(registry, UNDERLINE_COMMAND_NAME, {
      context: {
        document,
        selection: {
          anchor: { path: [0, 0], offset: 0 },
          focus: { path: [0, 0], offset: 1 },
        },
      },
    });

    expect(underlined.ok).toBe(true);
    expect(underlined.transaction?.operations[0]).toMatchObject({
      mark: "underline",
      type: "toggle_mark",
    });

    const struck = executeCommand(registry, STRIKE_COMMAND_NAME, {
      context: {
        document,
        selection: {
          anchor: { path: [0, 0], offset: 0 },
          focus: { path: [0, 0], offset: 1 },
        },
      },
    });

    expect(struck.ok).toBe(true);
    expect(struck.transaction?.operations[0]).toMatchObject({
      mark: "strike",
      type: "toggle_mark",
    });
  });

  it.each([
    [SET_FONT_SIZE_COMMAND_NAME, { fontSize: 20 }, "fontSize", 20],
    [SET_TEXT_COLOR_COMMAND_NAME, { textColor: "#0AF" }, "textColor", "#00aaff"],
    [
      SET_BACKGROUND_COLOR_COMMAND_NAME,
      { backgroundColor: "#FC0" },
      "backgroundColor",
      "#ffcc00",
    ],
  ] as const)(
    "executes %s through the default registry",
    (commandName, payload, attribute, value) => {
      const registry = createDefaultCommandRegistry();
      const document = createDocument([createParagraph([createText("样式")])]);
      const context = {
        document,
        selection: {
          anchor: { path: [0, 0], offset: 0 },
          focus: { path: [0, 0], offset: 2 },
        },
      };
      const applied = executeCommand(registry, commandName, { context, payload });

      expect(applied.ok).toBe(true);
      expect(applied.transaction?.operations[0]).toMatchObject({
        attribute,
        type: "set_mark_attribute",
        value,
      });

      const styledDocument = applyTransaction(document, applied.transaction!);

      if (!applied.selection) {
        throw new Error(`${commandName} should return a selection.`);
      }

      const removed = executeCommand(registry, commandName, {
        context: {
          document: styledDocument,
          selection: applied.selection,
        },
        payload: { [attribute]: null },
      });

      expect(removed.ok).toBe(true);
      expect(removed.transaction?.operations[0]).toMatchObject({
        attribute,
        type: "set_mark_attribute",
        value: null,
      });
      expect(
        applyTransaction(styledDocument, removed.transaction!).children[0]?.children[0]
          ?.marks,
      ).toBeUndefined();
    },
  );

  it("executes block type commands through the default registry", () => {
    const registry = createDefaultCommandRegistry();
    const document = createDocument([
      createParagraph([createText("正文")]),
      createHeading(2, [createText("标题")]),
      createQuote([createText("引用")]),
    ]);
    const selection = {
      anchor: { path: [0, 0], offset: 0 },
      focus: { path: [2, 0], offset: 1 },
    };
    const headingResult = executeCommand(registry, SET_HEADING_COMMAND_NAME, {
      context: { document, selection },
      payload: { level: 3 },
    });
    const headingDocument = applyTransaction(document, headingResult.transaction!);

    if (!headingResult.selection) {
      throw new Error("Set heading command should return a selection.");
    }

    expect(headingDocument.children.map((block) => block.type)).toEqual([
      "heading",
      "heading",
      "heading",
    ]);
    expect(
      headingDocument.children.map((block) =>
        block.type === "heading" ? block.level : null,
      ),
    ).toEqual([3, 3, 3]);

    const quoteResult = executeCommand(registry, TOGGLE_QUOTE_COMMAND_NAME, {
      context: {
        document: headingDocument,
        selection: headingResult.selection,
      },
    });

    expect(
      applyTransaction(headingDocument, quoteResult.transaction!).children.map(
        (block) => block.type,
      ),
    ).toEqual(["quote", "quote", "quote"]);
  });
});

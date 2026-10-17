import { describe, expect, it } from "vitest";
import {
  applyTransaction,
  canExecuteCommand,
  createBulletList,
  createDefaultCommandRegistry,
  createDocument,
  createListItem,
  createParagraph,
  createTable,
  createText,
  DEFAULT_CLIPBOARD_PARSERS,
  parseClipboardData,
  PASTE_COMMAND_NAME,
  executeCommand,
  validateDocument,
} from "../../src";

const source = {
  types: ["text/plain", "text/html", "text/markdown"],
  getData: (type: string) =>
    type === "text/markdown" ? "# 标题" : type === "text/html" ? "<b>HTML</b>" : "原文",
};

describe("clipboard parsing for a paste target", () => {
  it.each([
    {
      name: "top-level",
      document: createDocument([createParagraph([createText("前后")])]),
      path: [0, 0],
      offset: 1,
      mime: "text/markdown",
    },
    {
      name: "list item",
      document: createDocument([
        createBulletList([createListItem([createText("前后")])]),
      ]),
      path: [0, 0, 0],
      offset: 1,
      mime: "text/plain",
    },
    {
      name: "cell",
      document: createDocument([createTable(1, 2)]),
      path: [0, 0, 0, 0, 0],
      offset: 0,
      mime: "text/plain",
    },
  ])(
    "chooses the first executable format for $name",
    ({ document, path, offset, mime }) => {
      const registry = createDefaultCommandRegistry();
      const point = { path, offset };
      const context = { document, selection: { anchor: point, focus: point } };
      const fragment = parseClipboardData(
        source,
        DEFAULT_CLIPBOARD_PARSERS,
        (candidate) =>
          canExecuteCommand(registry, PASTE_COMMAND_NAME, {
            context,
            payload: { fragment: candidate },
          }),
      );
      expect(fragment?.mimeType).toBe(mime);
      const result = executeCommand(registry, PASTE_COMMAND_NAME, {
        context,
        payload: { fragment },
      });
      expect(result.status).toBe("success");
      expect(
        validateDocument(applyTransaction(document, result.transaction!)).valid,
      ).toBe(true);
    },
  );

  it("does not synthesize plain text for a cell when rich formats are the only data", () => {
    const registry = createDefaultCommandRegistry();
    const point = { path: [0, 0, 0, 0, 0], offset: 0 };
    const context = {
      document: createDocument([createTable()]),
      selection: { anchor: point, focus: point },
    };
    const fragment = parseClipboardData(
      { ...source, types: ["text/html", "text/markdown"] },
      DEFAULT_CLIPBOARD_PARSERS,
      (candidate) =>
        canExecuteCommand(registry, PASTE_COMMAND_NAME, {
          context,
          payload: { fragment: candidate },
        }),
    );
    expect(fragment).toBeUndefined();
  });

  it("does not accept any MIME type for a cross-cell selection", () => {
    const registry = createDefaultCommandRegistry();
    const context = {
      document: createDocument([createTable(1, 2)]),
      selection: {
        anchor: { path: [0, 0, 0, 0, 0], offset: 0 },
        focus: { path: [0, 0, 1, 0, 0], offset: 0 },
      },
    };
    expect(
      parseClipboardData(source, DEFAULT_CLIPBOARD_PARSERS, (candidate) =>
        canExecuteCommand(registry, PASTE_COMMAND_NAME, {
          context,
          payload: { fragment: candidate },
        }),
      ),
    ).toBeUndefined();
  });
});

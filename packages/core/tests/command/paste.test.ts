import { describe, expect, it } from "vitest";

import {
  applyTransaction,
  canExecutePasteCommand,
  createDefaultCommandRegistry,
  createDocument,
  createParagraph,
  createText,
  executeCommand,
  parsePlainText,
  PASTE_COMMAND_NAME,
  pasteCommand,
} from "../../src";

describe("pasteCommand", () => {
  it("inserts a single plain-text line at the caret", () => {
    const document = createDocument([createParagraph([createText("前后")])]);
    const input = {
      context: {
        document,
        selection: {
          anchor: { offset: 1, path: [0, 0] },
          focus: { offset: 1, path: [0, 0] },
        },
      },
      payload: { fragment: parsePlainText("中间")! },
    };
    const result = pasteCommand.execute(input);

    expect(canExecutePasteCommand(input)).toBe(true);
    expect(result.selection?.anchor).toEqual({ offset: 3, path: [0, 0] });
    expect(applyTransaction(document, result.transaction!).children).toEqual([
      createParagraph([createText("前中间后")]),
    ]);
  });

  it("replaces an expanded selection", () => {
    const document = createDocument([createParagraph([createText("前旧后")])]);
    const result = executeCommand(createDefaultCommandRegistry(), PASTE_COMMAND_NAME, {
      context: {
        document,
        selection: {
          anchor: { offset: 1, path: [0, 0] },
          focus: { offset: 2, path: [0, 0] },
        },
      },
      payload: { fragment: parsePlainText("新")! },
    });

    expect(result.transaction?.operations.map((operation) => operation.type)).toEqual([
      "delete_text",
      "insert_text",
    ]);
    expect(applyTransaction(document, result.transaction!).children).toEqual([
      createParagraph([createText("前新后")]),
    ]);
  });

  it("skips missing fragments and invalid selections", () => {
    const document = createDocument();

    expect(pasteCommand.execute({ context: { document } }).status).toBe("skipped");
    expect(
      pasteCommand.execute({
        context: {
          document,
          selection: {
            anchor: { offset: 0, path: [9, 0] },
            focus: { offset: 0, path: [9, 0] },
          },
        },
        payload: { fragment: parsePlainText("文字")! },
      }).status,
    ).toBe("skipped");
  });
});

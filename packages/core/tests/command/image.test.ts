import { describe, expect, it } from "vitest";

import {
  applyTransaction,
  canExecuteInsertImageCommand,
  canExecuteDeleteImageCommand,
  createBlockSelection,
  createDocument,
  createParagraph,
  createText,
  deleteImageCommand,
  createImage,
  insertImageCommand,
} from "../../src";

function createInput(payload: unknown) {
  return {
    context: {
      document: createDocument([createParagraph([createText("上下")])]),
      selection: {
        anchor: { offset: 1, path: [0, 0] },
        focus: { offset: 1, path: [0, 0] },
      },
    },
    payload,
  };
}

describe("insertImageCommand", () => {
  it("splits the selected block around an image", () => {
    const input = createInput({
      alt: "封面",
      height: 360,
      src: "https://example.com/cover.png",
      width: 640,
    });
    const result = insertImageCommand.execute(input);

    expect(canExecuteInsertImageCommand(input)).toBe(true);
    expect(result).toMatchObject({
      commandName: "insertImage",
      ok: true,
      selection: {
        anchor: { offset: 0, path: [2, 0] },
        focus: { offset: 0, path: [2, 0] },
      },
      status: "success",
    });
    expect(
      applyTransaction(input.context.document, result.transaction!).children,
    ).toEqual([
      { children: [{ text: "上", type: "text" }], type: "paragraph" },
      {
        alt: "封面",
        children: [],
        height: 360,
        src: "https://example.com/cover.png",
        status: "ready",
        type: "image",
        width: 640,
      },
      { children: [{ text: "下", type: "text" }], type: "paragraph" },
    ]);
  });

  it.each([
    undefined,
    { src: "javascript:alert(1)" },
    { src: "/relative.png" },
    { height: 0, src: "https://example.com/image.png" },
    { src: "https://example.com/image.png", status: "pending" },
  ])("skips invalid payload %#", (payload) => {
    const input = createInput(payload);

    expect(canExecuteInsertImageCommand(input)).toBe(false);
    expect(insertImageCommand.execute(input).status).toBe("skipped");
  });
});

describe("deleteImageCommand", () => {
  it("deletes an image and moves selection to the following text", () => {
    const document = createDocument([
      createParagraph([createText("上")]),
      createImage("https://example.com/cover.png"),
      createParagraph([createText("下")]),
    ]);
    const input = {
      context: { document },
      payload: { selection: createBlockSelection([1]) },
    };
    const result = deleteImageCommand.execute(input);

    expect(canExecuteDeleteImageCommand(input)).toBe(true);
    expect(result.selection).toEqual({
      anchor: { offset: 0, path: [1, 0] },
      focus: { offset: 0, path: [1, 0] },
    });
    expect(applyTransaction(document, result.transaction!).children).toEqual([
      createParagraph([createText("上")]),
      createParagraph([createText("下")]),
    ]);
  });

  it("adds an editable paragraph when no text remains", () => {
    const document = createDocument([createImage("https://example.com/cover.png")]);
    const result = deleteImageCommand.execute({
      context: { document },
      payload: { selection: createBlockSelection([0]) },
    });

    expect(applyTransaction(document, result.transaction!)).toEqual(
      createDocument([createParagraph()]),
    );
    expect(result.selection?.anchor).toEqual({ offset: 0, path: [0, 0] });
  });

  it("skips non-image and malformed selections", () => {
    const document = createDocument([createParagraph([createText("正文")])]);

    expect(
      canExecuteDeleteImageCommand({
        context: { document },
        payload: { selection: createBlockSelection([0]) },
      }),
    ).toBe(false);
    expect(
      deleteImageCommand.execute({ context: { document }, payload: {} }).status,
    ).toBe("skipped");
  });
});

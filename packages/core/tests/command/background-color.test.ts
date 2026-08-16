import { describe, expect, it } from "vitest";

import {
  applyTransaction,
  canExecuteSetBackgroundColorCommand,
  createDefaultCommandRegistry,
  createDocument,
  createParagraph,
  createText,
  executeCommand,
  insertTextCommand,
  queryCommandState,
  SET_BACKGROUND_COLOR_COMMAND_NAME,
  setBackgroundColorCommand,
} from "../../src";

describe("setBackgroundColorCommand", () => {
  it("sets a sanitized background color on a selected range", () => {
    const document = createDocument([createParagraph([createText("你好世界")])]);
    const input = {
      context: {
        document,
        selection: {
          anchor: { path: [0, 0], offset: 1 },
          focus: { path: [0, 0], offset: 3 },
        },
      },
      payload: { backgroundColor: "#FC0" },
    };
    const result = setBackgroundColorCommand.execute(input);

    expect(canExecuteSetBackgroundColorCommand(input)).toBe(true);
    expect(result.ok).toBe(true);
    expect(result.transaction?.operations).toEqual([
      {
        attribute: "backgroundColor",
        range: {
          anchor: { path: [0, 0], offset: 1 },
          focus: { path: [0, 0], offset: 3 },
        },
        type: "set_mark_attribute",
        value: "#ffcc00",
      },
    ]);
    expect(
      applyTransaction(document, result.transaction!).children[0]?.children,
    ).toEqual([
      { text: "你", type: "text" },
      { marks: { backgroundColor: "#ffcc00" }, text: "好世", type: "text" },
      { text: "界", type: "text" },
    ]);
    expect(result.selection).toEqual({
      anchor: { path: [0, 1], offset: 0 },
      focus: { path: [0, 1], offset: 2 },
    });
  });

  it("sets background color across sibling nodes while preserving text color", () => {
    const document = createDocument([
      createParagraph([
        createText("你", { fontSize: 18, textColor: "#1677ff" }),
        createText("好", { bold: true, textColor: "#1677ff" }),
        createText("世界", { textColor: "#1677ff" }),
      ]),
    ]);
    const result = setBackgroundColorCommand.execute({
      context: {
        document,
        selection: {
          anchor: { path: [0, 2], offset: 1 },
          focus: { path: [0, 0], offset: 0 },
        },
      },
      payload: { backgroundColor: "#fff4cc" },
    });

    expect(
      applyTransaction(document, result.transaction!).children[0]?.children,
    ).toEqual([
      {
        marks: {
          backgroundColor: "#fff4cc",
          fontSize: 18,
          textColor: "#1677ff",
        },
        text: "你",
        type: "text",
      },
      {
        marks: {
          backgroundColor: "#fff4cc",
          bold: true,
          textColor: "#1677ff",
        },
        text: "好",
        type: "text",
      },
      {
        marks: {
          backgroundColor: "#fff4cc",
          textColor: "#1677ff",
        },
        text: "世",
        type: "text",
      },
      { marks: { textColor: "#1677ff" }, text: "界", type: "text" },
    ]);
  });

  it("uses a collapsed highlighted placeholder for later input", () => {
    const document = createDocument([createParagraph([createText("你好世界")])]);
    const backgroundResult = setBackgroundColorCommand.execute({
      context: {
        document,
        selection: {
          anchor: { path: [0, 0], offset: 2 },
          focus: { path: [0, 0], offset: 2 },
        },
      },
      payload: { backgroundColor: "#fff4cc" },
    });
    const highlightedDocument = applyTransaction(
      document,
      backgroundResult.transaction!,
    );

    if (!backgroundResult.selection) {
      throw new Error("Set background color command should return a selection.");
    }

    const insertResult = insertTextCommand.execute({
      context: {
        document: highlightedDocument,
        selection: backgroundResult.selection,
      },
      payload: { text: "亮" },
    });

    expect(
      applyTransaction(highlightedDocument, insertResult.transaction!).children[0]
        ?.children,
    ).toEqual([
      { text: "你好", type: "text" },
      { marks: { backgroundColor: "#fff4cc" }, text: "亮", type: "text" },
      { text: "世界", type: "text" },
    ]);
  });

  it("cancels background color while preserving other marks", () => {
    const document = createDocument([
      createParagraph([
        createText("取消背景", {
          backgroundColor: "#fff4cc",
          bold: true,
          fontSize: 18,
          textColor: "#1677ff",
        }),
      ]),
    ]);
    const result = setBackgroundColorCommand.execute({
      context: {
        document,
        selection: {
          anchor: { path: [0, 0], offset: 0 },
          focus: { path: [0, 0], offset: 4 },
        },
      },
      payload: { backgroundColor: null },
    });

    expect(result.ok).toBe(true);
    expect(
      applyTransaction(document, result.transaction!).children[0]?.children[0],
    ).toEqual({
      marks: { bold: true, fontSize: 18, textColor: "#1677ff" },
      text: "取消背景",
      type: "text",
    });
  });

  it.each([
    { backgroundColor: "yellow" },
    { backgroundColor: "#abcd" },
    { backgroundColor: "rgb(255, 255, 0)" },
    { backgroundColor: "#fff; display: none" },
    {},
  ])("skips an unsafe payload: $backgroundColor", (payload) => {
    const document = createDocument([createParagraph([createText("背景")])]);
    const input = {
      context: {
        document,
        selection: {
          anchor: { path: [0, 0], offset: 0 },
          focus: { path: [0, 0], offset: 2 },
        },
      },
      payload,
    };

    expect(canExecuteSetBackgroundColorCommand(input)).toBe(false);
    expect(setBackgroundColorCommand.execute(input)).toEqual({
      commandName: SET_BACKGROUND_COLOR_COMMAND_NAME,
      ok: false,
      reason: "Set background color command requires a safe color and text selection.",
      status: "skipped",
    });
  });

  it("skips a selection that crosses paragraphs", () => {
    const document = createDocument([
      createParagraph([createText("第一段")]),
      createParagraph([createText("第二段")]),
    ]);
    const input = {
      context: {
        document,
        selection: {
          anchor: { path: [0, 0], offset: 0 },
          focus: { path: [1, 0], offset: 1 },
        },
      },
      payload: { backgroundColor: "#fff4cc" },
    };

    expect(canExecuteSetBackgroundColorCommand(input)).toBe(false);
    expect(setBackgroundColorCommand.execute(input).status).toBe("skipped");
  });

  it("executes through the default command registry", () => {
    const registry = createDefaultCommandRegistry();
    const document = createDocument([createParagraph([createText("背景")])]);
    const input = {
      context: {
        document,
        selection: {
          anchor: { path: [0, 0], offset: 0 },
          focus: { path: [0, 0], offset: 2 },
        },
      },
      payload: { backgroundColor: "#fff4cc" },
    };

    expect(
      queryCommandState(registry, SET_BACKGROUND_COLOR_COMMAND_NAME, input),
    ).toEqual({
      active: false,
      commandName: SET_BACKGROUND_COLOR_COMMAND_NAME,
      disabled: false,
      registered: true,
    });
    expect(executeCommand(registry, SET_BACKGROUND_COLOR_COMMAND_NAME, input).ok).toBe(
      true,
    );
    expect(
      queryCommandState(registry, SET_BACKGROUND_COLOR_COMMAND_NAME, {
        ...input,
        payload: { backgroundColor: "yellow" },
      }).disabled,
    ).toBe(true);
  });
});

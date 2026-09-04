import { describe, expect, it } from "vitest";

import {
  applyTransaction,
  canExecuteSetLinkCommand,
  canExecuteUnsetLinkCommand,
  createCodeBlock,
  createDefaultCommandRegistry,
  createDocument,
  createHistorySnapshot,
  createHistoryState,
  createHeading,
  createParagraph,
  createText,
  createTransactionAcceptanceReport,
  executeCommand,
  getSelectedLinkMark,
  isLinkCommandActive,
  queryCommandState,
  recordHistory,
  redoHistory,
  SET_LINK_COMMAND_NAME,
  setLinkCommand,
  summarizeOperation,
  UNSET_LINK_COMMAND_NAME,
  unsetLinkCommand,
  undoHistory,
} from "../../src";

describe("setLinkCommand", () => {
  it("sets a normalized link on selected text", () => {
    const document = createDocument([createParagraph([createText("项目文档")])]);
    const input = {
      context: {
        document,
        selection: {
          anchor: { path: [0, 0], offset: 0 },
          focus: { path: [0, 0], offset: 4 },
        },
      },
      payload: {
        href: " HTTPS://Example.com/docs ",
        rel: "NOFOLLOW noopener",
        target: "_blank",
      },
    };
    const result = setLinkCommand.execute(input);

    expect(canExecuteSetLinkCommand(input)).toBe(true);
    expect(result.ok).toBe(true);
    expect(result.transaction?.operations).toEqual([
      {
        link: {
          href: "https://example.com/docs",
          rel: "nofollow noopener",
          target: "_blank",
        },
        range: input.context.selection,
        type: "set_link",
      },
    ]);
    expect(
      applyTransaction(document, result.transaction!).children[0]?.children,
    ).toEqual([
      {
        marks: {
          link: {
            href: "https://example.com/docs",
            rel: "nofollow noopener",
            target: "_blank",
          },
        },
        text: "项目文档",
        type: "text",
      },
    ]);
    expect(result.selection).toEqual(input.context.selection);
  });

  it("overwrites old links across sibling nodes", () => {
    const document = createDocument([
      createParagraph([
        createText("项目", {
          bold: true,
          link: { href: "https://old.example.com/" },
        }),
        createText("文档", {
          link: { href: "https://other.example.com/" },
          underline: true,
        }),
      ]),
    ]);
    const result = setLinkCommand.execute({
      context: {
        document,
        selection: {
          anchor: { path: [0, 1], offset: 2 },
          focus: { path: [0, 0], offset: 0 },
        },
      },
      payload: { href: "https://example.com/latest" },
    });

    expect(
      applyTransaction(document, result.transaction!).children[0]?.children,
    ).toEqual([
      {
        marks: {
          bold: true,
          link: { href: "https://example.com/latest" },
        },
        text: "项目",
        type: "text",
      },
      {
        marks: {
          link: { href: "https://example.com/latest" },
          underline: true,
        },
        text: "文档",
        type: "text",
      },
    ]);
    expect(result.selection).toEqual({
      anchor: { path: [0, 0], offset: 0 },
      focus: { path: [0, 1], offset: 2 },
    });
  });

  it("sets a link inside a heading", () => {
    const document = createDocument([createHeading(3, [createText("标题链接")])]);
    const result = setLinkCommand.execute({
      context: {
        document,
        selection: {
          anchor: { path: [0, 0], offset: 2 },
          focus: { path: [0, 0], offset: 4 },
        },
      },
      payload: { href: "https://example.com/heading" },
    });
    const nextDocument = applyTransaction(document, result.transaction!);

    expect(result.ok).toBe(true);
    expect(nextDocument.children[0]).toMatchObject({ level: 3, type: "heading" });
    expect(nextDocument.children[0]?.children).toEqual([
      { text: "标题", type: "text" },
      {
        marks: { link: { href: "https://example.com/heading" } },
        text: "链接",
        type: "text",
      },
    ]);
  });

  it.each([
    { payload: { href: "javascript:alert(1)" }, title: "危险协议" },
    { payload: { href: "/relative" }, title: "相对地址" },
    { payload: {}, title: "缺少地址" },
  ])("skips $title", ({ payload }) => {
    const document = createDocument([createParagraph([createText("链接")])]);
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

    expect(canExecuteSetLinkCommand(input)).toBe(false);
    expect(setLinkCommand.execute(input)).toEqual({
      commandName: SET_LINK_COMMAND_NAME,
      ok: false,
      reason: "Set link command requires a safe link and non-collapsed text selection.",
      status: "skipped",
    });
  });
});

describe("unsetLinkCommand", () => {
  it("removes links across selected nodes and preserves other marks", () => {
    const document = createDocument([
      createParagraph([
        createText("项目", {
          bold: true,
          link: { href: "https://example.com/" },
        }),
        createText("文档", {
          link: { href: "https://example.com/" },
          textColor: "#1677ff",
        }),
      ]),
    ]);
    const input = {
      context: {
        document,
        selection: {
          anchor: { path: [0, 0], offset: 0 },
          focus: { path: [0, 1], offset: 2 },
        },
      },
    };
    const result = unsetLinkCommand.execute(input);

    expect(canExecuteUnsetLinkCommand(input)).toBe(true);
    expect(result.transaction?.operations).toEqual([
      {
        link: null,
        range: input.context.selection,
        type: "set_link",
      },
    ]);
    expect(
      applyTransaction(document, result.transaction!).children[0]?.children,
    ).toEqual([
      { marks: { bold: true }, text: "项目", type: "text" },
      {
        marks: { textColor: "#1677ff" },
        text: "文档",
        type: "text",
      },
    ]);
  });

  it("skips an unlinked selection", () => {
    const document = createDocument([createParagraph([createText("普通文本")])]);
    const input = {
      context: {
        document,
        selection: {
          anchor: { path: [0, 0], offset: 0 },
          focus: { path: [0, 0], offset: 4 },
        },
      },
    };

    expect(canExecuteUnsetLinkCommand(input)).toBe(false);
    expect(unsetLinkCommand.execute(input)).toEqual({
      commandName: UNSET_LINK_COMMAND_NAME,
      ok: false,
      reason: "Unset link command requires linked text in a non-collapsed selection.",
      status: "skipped",
    });
  });
});

describe("link command state", () => {
  it("reads a link at a collapsed caret", () => {
    const document = createDocument([
      createParagraph([
        createText("链接文本", {
          link: {
            href: "https://example.com/docs",
            rel: "noopener noreferrer",
            target: "_blank",
          },
        }),
      ]),
    ]);

    expect(
      getSelectedLinkMark({
        context: {
          document,
          selection: {
            anchor: { path: [0, 0], offset: 2 },
            focus: { path: [0, 0], offset: 2 },
          },
        },
      }),
    ).toEqual({
      href: "https://example.com/docs",
      rel: "noopener noreferrer",
      target: "_blank",
    });
  });

  it("reads one shared link across selected sibling nodes", () => {
    const document = createDocument([
      createParagraph([
        createText("项目", {
          bold: true,
          link: { href: "https://example.com/docs" },
        }),
        createText("文档", {
          link: { href: "https://example.com/docs" },
          underline: true,
        }),
      ]),
    ]);

    expect(
      getSelectedLinkMark({
        context: {
          document,
          selection: {
            anchor: { path: [0, 1], offset: 2 },
            focus: { path: [0, 0], offset: 0 },
          },
        },
      }),
    ).toEqual({ href: "https://example.com/docs" });
  });

  it("does not report a shared link for different destinations", () => {
    const document = createDocument([
      createParagraph([
        createText("项目", { link: { href: "https://example.com/project" } }),
        createText("文档", { link: { href: "https://example.com/docs" } }),
      ]),
    ]);
    const input = {
      context: {
        document,
        selection: {
          anchor: { path: [0, 0], offset: 0 },
          focus: { path: [0, 1], offset: 2 },
        },
      },
    };

    expect(getSelectedLinkMark(input)).toBeUndefined();
    expect(isLinkCommandActive(input)).toBe(false);
  });

  it("is active only when every selected text part has a link", () => {
    const document = createDocument([
      createParagraph([
        createText("已链接", { link: { href: "https://example.com/" } }),
        createText("普通"),
      ]),
    ]);

    expect(
      isLinkCommandActive({
        context: {
          document,
          selection: {
            anchor: { path: [0, 0], offset: 0 },
            focus: { path: [0, 0], offset: 3 },
          },
        },
      }),
    ).toBe(true);
    expect(
      isLinkCommandActive({
        context: {
          document,
          selection: {
            anchor: { path: [0, 0], offset: 0 },
            focus: { path: [0, 1], offset: 2 },
          },
        },
      }),
    ).toBe(false);
  });

  it("disables link commands for collapsed selections", () => {
    const document = createDocument([
      createParagraph([createText("链接", { link: { href: "https://example.com/" } })]),
    ]);
    const input = {
      context: {
        document,
        selection: {
          anchor: { path: [0, 0], offset: 1 },
          focus: { path: [0, 0], offset: 1 },
        },
      },
      payload: { href: "https://example.com/next" },
    };

    expect(canExecuteSetLinkCommand(input)).toBe(false);
    expect(canExecuteUnsetLinkCommand(input)).toBe(false);
    expect(isLinkCommandActive(input)).toBe(false);
    expect(setLinkCommand.execute(input).status).toBe("skipped");
    expect(unsetLinkCommand.execute(input).status).toBe("skipped");
  });

  it("disables link commands inside code blocks", () => {
    const document = createDocument([createCodeBlock([createText("code")])]);
    const input = {
      context: {
        document,
        selection: {
          anchor: { path: [0, 0], offset: 0 },
          focus: { path: [0, 0], offset: 4 },
        },
      },
      payload: { href: "https://example.com" },
    };

    expect(canExecuteSetLinkCommand(input)).toBe(false);
    expect(canExecuteUnsetLinkCommand(input)).toBe(false);
  });

  it("disables link commands across paragraphs", () => {
    const document = createDocument([
      createParagraph([
        createText("第一段", { link: { href: "https://example.com/" } }),
      ]),
      createParagraph([
        createText("第二段", { link: { href: "https://example.com/" } }),
      ]),
    ]);
    const input = {
      context: {
        document,
        selection: {
          anchor: { path: [0, 0], offset: 0 },
          focus: { path: [1, 0], offset: 2 },
        },
      },
      payload: { href: "https://example.com/next" },
    };

    expect(canExecuteSetLinkCommand(input)).toBe(false);
    expect(canExecuteUnsetLinkCommand(input)).toBe(false);
    expect(setLinkCommand.execute(input).status).toBe("skipped");
    expect(unsetLinkCommand.execute(input).status).toBe("skipped");
  });
});

describe("link command integration", () => {
  it("runs through the default registry and history lifecycle", () => {
    const registry = createDefaultCommandRegistry();
    const document = createDocument([createParagraph([createText("项目文档")])]);
    const selection = {
      anchor: { path: [0, 0], offset: 0 },
      focus: { path: [0, 0], offset: 4 },
    };
    const input = {
      context: { document, selection },
      payload: { href: "https://example.com/docs" },
    };

    expect(queryCommandState(registry, SET_LINK_COMMAND_NAME, input)).toEqual({
      active: false,
      commandName: SET_LINK_COMMAND_NAME,
      disabled: false,
      registered: true,
    });

    const result = executeCommand(registry, SET_LINK_COMMAND_NAME, input);

    if (!result.transaction || !result.selection) {
      throw new Error("Set link command should return a transaction and selection.");
    }

    const linkedDocument = applyTransaction(document, result.transaction);
    const acceptance = createTransactionAcceptanceReport(document, result.transaction);
    const history = recordHistory({
      after: createHistorySnapshot(linkedDocument, result.selection),
      before: createHistorySnapshot(document, selection),
      history: createHistoryState(),
      transaction: result.transaction,
    });
    const undone = undoHistory(history);
    const redone = undone ? redoHistory(undone.history) : undefined;

    expect(acceptance).toMatchObject({
      ok: true,
      transaction: {
        operationCount: 1,
        operationTypes: ["set_link"],
        textOperationCount: 1,
      },
    });
    expect(summarizeOperation(result.transaction.operations[0]!)).toEqual({
      collapsedRange: false,
      linkHref: "https://example.com/docs",
      scope: "text",
      targetPath: [0, 0],
      textLength: 4,
      type: "set_link",
    });
    expect(undone?.document).toEqual(document);
    expect(redone?.document).toEqual(linkedDocument);
    expect(
      queryCommandState(registry, UNSET_LINK_COMMAND_NAME, {
        context: {
          document: linkedDocument,
          selection: result.selection,
        },
      }),
    ).toEqual({
      active: true,
      commandName: UNSET_LINK_COMMAND_NAME,
      disabled: false,
      registered: true,
    });
  });
});

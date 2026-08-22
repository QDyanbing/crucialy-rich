import { describe, expect, it } from "vitest";

import {
  applyTransaction,
  canExecuteSetLinkCommand,
  canExecuteUnsetLinkCommand,
  createDocument,
  createParagraph,
  createText,
  SET_LINK_COMMAND_NAME,
  setLinkCommand,
  UNSET_LINK_COMMAND_NAME,
  unsetLinkCommand,
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

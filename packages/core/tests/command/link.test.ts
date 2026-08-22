import { describe, expect, it } from "vitest";

import {
  applyTransaction,
  canExecuteSetLinkCommand,
  createDocument,
  createParagraph,
  createText,
  SET_LINK_COMMAND_NAME,
  setLinkCommand,
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

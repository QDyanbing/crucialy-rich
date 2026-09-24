import { describe, expect, it } from "vitest";

import {
  canExecuteSetLinkCommand,
  canExecuteUnsetLinkCommand,
  createCodeBlock,
  createDivider,
  createDocument,
  createParagraph,
  createQuote,
  createText,
  setLinkCommand,
  unsetLinkCommand,
} from "../../src";

describe("cross-block link command boundaries", () => {
  it("preserves a reversed text block selection", () => {
    const document = createDocument([
      createParagraph([createText("正文")]),
      createQuote([createText("引用")]),
    ]);
    const result = setLinkCommand.execute({
      context: {
        document,
        selection: {
          anchor: { path: [1, 0], offset: 1 },
          focus: { path: [0, 0], offset: 1 },
        },
      },
      payload: { href: "https://example.com/reverse" },
    });

    expect(result.transaction?.operations).toHaveLength(2);
    expect(result.selection).toEqual({
      anchor: { path: [1, 0], offset: 1 },
      focus: { path: [0, 1], offset: 0 },
    });
  });

  it("keeps the cross-block boundary when the first segment is empty", () => {
    const document = createDocument([
      createParagraph([createText("前")]),
      createParagraph([createText("后续")]),
    ]);
    const selection = {
      anchor: { path: [0, 0], offset: 1 },
      focus: { path: [1, 0], offset: 1 },
    };
    const result = setLinkCommand.execute({
      context: { document, selection },
      payload: { href: "https://example.com/edge" },
    });

    expect(result.transaction?.operations).toHaveLength(1);
    expect(result.selection).toEqual(selection);
  });

  it.each([
    { boundary: createDivider(), name: "Divider" },
    { boundary: createCodeBlock([createText("code")]), name: "CodeBlock" },
  ])("rejects a selection crossing $name", ({ boundary }) => {
    const link = { href: "https://example.com/current" };
    const document = createDocument([
      createParagraph([createText("开头", { link })]),
      boundary,
      createParagraph([createText("结尾", { link })]),
    ]);
    const input = {
      context: {
        document,
        selection: {
          anchor: { path: [0, 0], offset: 1 },
          focus: { path: [2, 0], offset: 1 },
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

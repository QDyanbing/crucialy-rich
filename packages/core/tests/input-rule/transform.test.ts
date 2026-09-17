import { describe, expect, it } from "vitest";

import {
  applyTransaction,
  createDocument,
  createMarkdownInputRuleResult,
  createParagraph,
  createText,
} from "../../src";

function applyRule(text: string, data: string) {
  const document = createDocument([createParagraph([createText(text)])]);
  const result = createMarkdownInputRuleResult({
    data,
    document,
    selection: {
      anchor: { path: [0, 0], offset: text.length },
      focus: { path: [0, 0], offset: text.length },
    },
  });

  return {
    document: result ? applyTransaction(document, result.transaction) : document,
    result,
  };
}

describe("createMarkdownInputRuleResult block rules", () => {
  it("turns a heading prefix into an empty level-one heading", () => {
    const { document, result } = applyRule("#", " ");

    expect(result?.transaction.operations.map((operation) => operation.type)).toEqual([
      "delete_text",
      "set_block_type",
    ]);
    expect(document.children[0]).toEqual({
      children: [{ text: "", type: "text" }],
      level: 1,
      type: "heading",
    });
    expect(result?.selection.anchor).toEqual({ path: [0, 0], offset: 0 });
  });

  it("turns a quote prefix into an empty quote", () => {
    const { document } = applyRule(">", " ");

    expect(document.children[0]).toEqual({
      children: [{ text: "", type: "text" }],
      type: "quote",
    });
  });

  it("turns a hyphen prefix into an empty bullet list", () => {
    const { document, result } = applyRule("-", " ");

    expect(result?.transaction.operations.map((operation) => operation.type)).toEqual([
      "delete_text",
      "remove_block",
      "insert_block",
    ]);
    expect(document.children[0]).toEqual({
      children: [{ children: [{ text: "", type: "text" }], type: "listItem" }],
      type: "bulletList",
    });
    expect(result?.selection.anchor).toEqual({ path: [0, 0, 0], offset: 0 });
  });

  it("turns a numeric prefix into an empty ordered list", () => {
    expect(applyRule("1.", " ").document.children[0]).toMatchObject({
      children: [{ type: "listItem" }],
      type: "orderedList",
    });
  });

  it("turns a completed fence into an empty code block", () => {
    const { document, result } = applyRule("``", "`");

    expect(document.children[0]).toEqual({
      children: [{ text: "", type: "text" }],
      type: "codeBlock",
    });
    expect(result?.selection.anchor).toEqual({ path: [0, 0], offset: 0 });
  });
});

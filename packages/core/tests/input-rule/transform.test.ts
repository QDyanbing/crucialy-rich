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

  it("leaves list and code matches for their structural rules", () => {
    expect(applyRule("-", " ").result).toBeUndefined();
    expect(applyRule("1.", " ").result).toBeUndefined();
    expect(applyRule("``", "`").result).toBeUndefined();
  });
});

import { describe, expect, it } from "vitest";
import {
  applyTransaction,
  createDocument,
  createParagraph,
  createText,
  createMarkdownInputRuleResult,
} from "../../src";
describe("ordered input rule suffix", () => {
  it.each(["正文", "😀组合é", "第一行\n第二行"])("preserves suffix %s", (suffix) => {
    const document = createDocument([createParagraph([createText(`1.${suffix}`)])]);
    const point = { path: [0, 0], offset: 2 };
    const result = createMarkdownInputRuleResult({
      document,
      data: " ",
      selection: { anchor: point, focus: point },
    })!;
    expect(applyTransaction(document, result.transaction).children[0]).toMatchObject({
      type: "orderedList",
      children: [{ children: [{ text: suffix }] }],
    });
    expect(result.selection.anchor).toEqual({ path: [0, 0, 0], offset: 0 });
  });
});

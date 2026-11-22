import { describe, expect, it } from "vitest";
import {
  applyTransaction,
  createDocument,
  createParagraph,
  createText,
  createMarkdownInputRuleResult,
} from "../../src";
describe("bullet input rule suffix", () => {
  it.each(["正文", "😀组合é", "第一行\n第二行"])("preserves suffix %s", (suffix) => {
    const document = createDocument([createParagraph([createText(`-${suffix}`)])]);
    const point = { path: [0, 0], offset: 1 };
    const result = createMarkdownInputRuleResult({
      document,
      data: " ",
      selection: { anchor: point, focus: point },
    })!;
    const after = applyTransaction(document, result.transaction);
    expect(after.children[0]).toMatchObject({
      type: "bulletList",
      children: [{ children: [{ text: suffix }] }],
    });
    expect(result.selection.anchor).toEqual({ path: [0, 0, 0], offset: 0 });
    expect(document.children[0]).toMatchObject({ children: [{ text: `-${suffix}` }] });
  });
});

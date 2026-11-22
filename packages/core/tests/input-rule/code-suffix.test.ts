import { describe, expect, it } from "vitest";
import {
  applyTransaction,
  createDocument,
  createParagraph,
  createText,
  createMarkdownInputRuleResult,
} from "../../src";
describe("code input rule suffix", () => {
  it.each(["正文", "😀组合é", "第一行\n第二行"])(
    "preserves literal suffix %s and removes marks",
    (suffix) => {
      const source = createDocument([
        createParagraph([
          createText("``" + suffix, {
            bold: true,
            link: { href: "https://example.com" },
          }),
        ]),
      ]);
      const point = { path: [0, 0], offset: 2 };
      const result = createMarkdownInputRuleResult({
        document: source,
        data: "`",
        selection: { anchor: point, focus: point },
      })!;
      expect(applyTransaction(source, result.transaction).children[0]).toEqual({
        type: "codeBlock",
        children: [{ type: "text", text: suffix }],
      });
      expect(result.selection.anchor).toEqual({ path: [0, 0], offset: 0 });
    },
  );
});

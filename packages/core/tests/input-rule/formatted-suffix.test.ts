import { describe, expect, it } from "vitest";
import {
  applyTransaction,
  createDocument,
  createParagraph,
  createText,
  createMarkdownInputRuleResult,
  isValidPoint,
  isListNode,
} from "../../src";
const rules = [
  { prefix: "#", data: " " },
  { prefix: ">", data: " " },
  { prefix: "-", data: " " },
  { prefix: "1.", data: " " },
  { prefix: "``", data: "`" },
];
describe("formatted input rule suffix isolation", () => {
  for (const batched of [false, true]) {
    it.each(rules)(
      `preserves formatted suffix for $prefix, batched ${batched}`,
      ({ prefix, data }) => {
        const document = createDocument([
          createParagraph([createText("前段")]),
          createParagraph([
            createText(batched ? "" : prefix, { bold: true }),
            createText("正文😀", {
              italic: true,
              link: { href: "https://example.com" },
            }),
          ]),
          createParagraph([createText("后段")]),
        ]);
        const before = structuredClone(document);
        const point = { path: [1, 0], offset: batched ? 0 : prefix.length };
        const result = createMarkdownInputRuleResult({
          document,
          data: batched ? prefix + data : data,
          selection: { anchor: point, focus: point },
        })!;
        const after = applyTransaction(document, result.transaction);
        const block = after.children[1]!;
        const texts = isListNode(block) ? block.children[0]!.children : block.children;
        expect(texts.map((node) => ("text" in node ? node.text : "")).join("")).toBe(
          "正文😀",
        );
        if (block.type !== "codeBlock")
          expect(texts).toContainEqual(
            createText("正文😀", {
              italic: true,
              link: { href: "https://example.com" },
            }),
          );
        else expect(texts).toEqual([createText("正文😀")]);
        expect(after.children[0]).toEqual(before.children[0]);
        expect(after.children[2]).toEqual(before.children[2]);
        expect(isValidPoint(after, result.selection.anchor)).toBe(true);
        expect(document).toEqual(before);
      },
    );
  }
});

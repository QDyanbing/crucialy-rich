import { describe, expect, it } from "vitest";
import {
  createDocument,
  createParagraph,
  createText,
  findMarkdownInputRule,
  createMarkdownInputRuleResult,
} from "../../src";
describe("input rules require new input", () => {
  it.each(["# ", "- ", "1. ", "> ", "```"])(
    "does not transform an existing prefix %s on empty data",
    (text) => {
      const point = { path: [0, 0], offset: text.length };
      const input = {
        data: "",
        document: createDocument([createParagraph([createText(text)])]),
        selection: { anchor: point, focus: point },
      };
      expect(findMarkdownInputRule(input)).toBeUndefined();
      expect(createMarkdownInputRuleResult(input)).toBeUndefined();
    },
  );
});

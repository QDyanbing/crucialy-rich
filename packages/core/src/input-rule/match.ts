import { isParagraphNode, type DocumentNode } from "../model";
import { getBlockTextOffset, isCollapsed, type RangeSelection } from "../selection";
import type { MarkdownInputRuleMatch, MarkdownInputRuleName } from "./types";

const MARKDOWN_INPUT_RULES: readonly {
  name: MarkdownInputRuleName;
  trigger: string;
}[] = [
  { name: "heading", trigger: "# " },
  { name: "bulletList", trigger: "- " },
  { name: "orderedList", trigger: "1. " },
  { name: "quote", trigger: "> " },
  { name: "codeBlock", trigger: "```" },
];

export interface FindMarkdownInputRuleInput {
  data: string;
  document: DocumentNode;
  selection: RangeSelection;
}

export function findMarkdownInputRule(
  input: FindMarkdownInputRuleInput,
): MarkdownInputRuleMatch | undefined {
  if (!isCollapsed(input.selection) || input.selection.anchor.path.length !== 2) {
    return undefined;
  }

  const point = input.selection.anchor;
  const [blockIndex] = point.path;
  const block =
    blockIndex === undefined ? undefined : input.document.children[blockIndex];
  const textOffset = getBlockTextOffset(input.document, point);

  if (blockIndex === undefined || !isParagraphNode(block) || textOffset === undefined) {
    return undefined;
  }

  const textBeforeCaret = block.children
    .map((node) => node.text)
    .join("")
    .slice(0, textOffset);
  const rule = MARKDOWN_INPUT_RULES.find(
    (candidate) => `${textBeforeCaret}${input.data}` === candidate.trigger,
  );

  if (!rule) {
    return undefined;
  }

  return {
    blockIndex,
    name: rule.name,
    prefixRange: {
      anchor: { path: [blockIndex, 0], offset: 0 },
      focus: { path: [...point.path], offset: point.offset },
    },
    trigger: rule.trigger,
  };
}

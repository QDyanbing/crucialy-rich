import type { RangeSelection } from "../selection";

export type MarkdownInputRuleName =
  | "bulletList"
  | "codeBlock"
  | "heading"
  | "orderedList"
  | "quote";

export interface MarkdownInputRuleMatch {
  blockIndex: number;
  name: MarkdownInputRuleName;
  prefixRange: RangeSelection;
  trigger: string;
}

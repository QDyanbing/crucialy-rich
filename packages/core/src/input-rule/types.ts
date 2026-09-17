import type { RangeSelection } from "../selection";
import type { Transaction } from "../operation";

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

export interface MarkdownInputRuleResult {
  name: MarkdownInputRuleName;
  selection: RangeSelection;
  transaction: Transaction;
}

import {
  createDeleteTextOperation,
  createSetBlockTypeOperation,
  createTransaction,
  type BlockTypeSpec,
} from "../operation";
import { findMarkdownInputRule, type FindMarkdownInputRuleInput } from "./match";
import type { MarkdownInputRuleResult } from "./types";

export function createMarkdownInputRuleResult(
  input: FindMarkdownInputRuleInput,
): MarkdownInputRuleResult | undefined {
  const match = findMarkdownInputRule(input);

  if (!match || (match.name !== "heading" && match.name !== "quote")) {
    return undefined;
  }

  const block: BlockTypeSpec =
    match.name === "heading" ? { level: 1, type: "heading" } : { type: "quote" };
  const point = { path: [match.blockIndex, 0], offset: 0 };

  return {
    name: match.name,
    selection: {
      anchor: point,
      focus: { path: [...point.path], offset: point.offset },
    },
    transaction: createTransaction([
      createDeleteTextOperation(match.prefixRange),
      createSetBlockTypeOperation([match.blockIndex], block),
    ]),
  };
}

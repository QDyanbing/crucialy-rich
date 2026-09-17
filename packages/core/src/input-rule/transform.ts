import {
  createInsertBlockOperation,
  createDeleteTextOperation,
  createRemoveBlockOperation,
  createSetBlockTypeOperation,
  createTransaction,
  type BlockTypeSpec,
} from "../operation";
import {
  createBulletList,
  createCodeBlock,
  createListItem,
  createOrderedList,
} from "../model";
import { findMarkdownInputRule, type FindMarkdownInputRuleInput } from "./match";
import type { MarkdownInputRuleResult } from "./types";

export function createMarkdownInputRuleResult(
  input: FindMarkdownInputRuleInput,
): MarkdownInputRuleResult | undefined {
  const match = findMarkdownInputRule(input);

  if (!match) {
    return undefined;
  }

  if (match.name === "bulletList" || match.name === "orderedList") {
    const list =
      match.name === "bulletList"
        ? createBulletList([createListItem()])
        : createOrderedList([createListItem()]);
    const point = { path: [match.blockIndex, 0, 0], offset: 0 };

    return {
      name: match.name,
      selection: {
        anchor: point,
        focus: { path: [...point.path], offset: point.offset },
      },
      transaction: createTransaction([
        createDeleteTextOperation(match.prefixRange),
        createRemoveBlockOperation([match.blockIndex]),
        createInsertBlockOperation([match.blockIndex], list),
      ]),
    };
  }

  if (match.name === "codeBlock") {
    const point = { path: [match.blockIndex, 0], offset: 0 };

    return {
      name: match.name,
      selection: {
        anchor: point,
        focus: { path: [...point.path], offset: point.offset },
      },
      transaction: createTransaction([
        createDeleteTextOperation(match.prefixRange),
        createRemoveBlockOperation([match.blockIndex]),
        createInsertBlockOperation([match.blockIndex], createCodeBlock()),
      ]),
    };
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

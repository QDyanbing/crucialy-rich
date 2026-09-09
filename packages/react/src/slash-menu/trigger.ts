import {
  getBlockTextOffset,
  getPointAtBlockTextOffset,
  isCollapsed,
  type DocumentNode,
  type RangeSelection,
} from "@crucialy-rich/core";

import type { SlashMenuTrigger } from "./types";

export function findSlashMenuTrigger(
  document: DocumentNode,
  selection?: RangeSelection,
): SlashMenuTrigger | undefined {
  if (!selection || !isCollapsed(selection) || selection.anchor.path.length !== 2) {
    return undefined;
  }

  const [blockIndex] = selection.anchor.path;
  const caretOffset = getBlockTextOffset(document, selection.anchor);

  if (blockIndex === undefined || caretOffset === undefined) {
    return undefined;
  }

  const block = document.children[blockIndex];

  if (block?.type !== "paragraph") {
    return undefined;
  }

  const textBeforeCaret = block.children
    .map((child) => child.text)
    .join("")
    .slice(0, caretOffset);
  const match = /\/([^\s/]*)$/u.exec(textBeforeCaret);
  const slashOffset = match?.index;

  if (
    match === null ||
    match === undefined ||
    slashOffset === undefined ||
    (slashOffset > 0 && !/\s/u.test(textBeforeCaret[slashOffset - 1]!))
  ) {
    return undefined;
  }

  const start = getPointAtBlockTextOffset(document, blockIndex, slashOffset, {
    affinity: "forward",
  });

  if (!start) {
    return undefined;
  }

  return {
    query: match[1] ?? "",
    range: {
      anchor: start,
      focus: {
        offset: selection.anchor.offset,
        path: [...selection.anchor.path],
      },
    },
    text: match[0],
  };
}

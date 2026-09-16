import { isParagraphNode } from "../model";
import type { ClipboardFragment } from "./types";

export type TableClipboardGrid = string[][];

export function getPlainTextTableGrid(
  fragment: ClipboardFragment,
): TableClipboardGrid | undefined {
  if (
    fragment.mimeType !== "text/plain" ||
    fragment.blocks.length === 0 ||
    !fragment.blocks.every(isParagraphNode)
  ) {
    return undefined;
  }

  const lines = fragment.blocks.map((block) =>
    block.children.map((node) => node.text).join(""),
  );

  if (lines.length === 1 && !lines[0]?.includes("\t")) {
    return undefined;
  }

  return lines.map((line) => line.split("\t"));
}

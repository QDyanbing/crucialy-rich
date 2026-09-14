import { createParagraph, createText } from "../model";
import type { ClipboardFragment, ClipboardParser } from "./types";

export function parsePlainText(value: string): ClipboardFragment | undefined {
  if (value.length === 0) {
    return undefined;
  }

  return {
    blocks: value
      .replaceAll("\r\n", "\n")
      .replaceAll("\r", "\n")
      .split("\n")
      .map((line) => createParagraph([createText(line)])),
    mimeType: "text/plain",
  };
}

export const plainTextClipboardParser: ClipboardParser = {
  mimeType: "text/plain",
  parse: parsePlainText,
};

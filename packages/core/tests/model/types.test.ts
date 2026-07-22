import { describe, expect, it } from "vitest";

import {
  TEXT_MARK_TYPES,
  type DocumentNode,
  type ParagraphNode,
  type TextMarkType,
  type TextNode,
} from "../../src/model/types";

describe("model node types", () => {
  it("describes a document with paragraph and text", () => {
    const text: TextNode = { type: "text", text: "hello" };
    const paragraph: ParagraphNode = { type: "paragraph", children: [text] };
    const document: DocumentNode = { type: "document", children: [paragraph] };

    expect(document.type).toBe("document");
    expect(document.children[0]?.type).toBe("paragraph");
    expect(document.children[0]?.children[0]?.text).toBe("hello");
  });

  it("describes text marks on text nodes", () => {
    const mark: TextMarkType = "bold";
    const text: TextNode = { type: "text", text: "hello", marks: { [mark]: true } };

    expect(TEXT_MARK_TYPES).toEqual(["bold", "italic"]);
    expect(text.marks?.bold).toBe(true);
  });
});

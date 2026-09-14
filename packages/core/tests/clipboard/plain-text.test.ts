import { describe, expect, it } from "vitest";

import { parsePlainText, plainTextClipboardParser } from "../../src";

describe("parsePlainText", () => {
  it("parses a single line as one paragraph", () => {
    expect(parsePlainText("一行文字")).toEqual({
      blocks: [
        {
          children: [{ text: "一行文字", type: "text" }],
          type: "paragraph",
        },
      ],
      mimeType: "text/plain",
    });
  });

  it("normalizes line endings and preserves empty lines", () => {
    const fragment = parsePlainText("第一行\r\n\r\n第三行\r第四行");

    expect(
      fragment?.blocks.map((block) =>
        block.type === "paragraph" ? block.children[0]?.text : undefined,
      ),
    ).toEqual(["第一行", "", "第三行", "第四行"]);
  });

  it("declines empty clipboard values", () => {
    expect(parsePlainText("")).toBeUndefined();
    expect(plainTextClipboardParser.mimeType).toBe("text/plain");
  });
});

import { describe, expect, it, vi } from "vitest";
import {
  createParagraph,
  createText,
  DEFAULT_CLIPBOARD_PARSERS,
  parseClipboardData,
  type ClipboardFragment,
} from "../../src";

function parse(formats: Record<string, string>) {
  return parseClipboardData(
    { types: Object.keys(formats), getData: (type) => formats[type] ?? "" },
    DEFAULT_CLIPBOARD_PARSERS,
  );
}

describe("Office clipboard plain text fallback", () => {
  it("prefers supplied plain text over Office HTML and Markdown", () => {
    expect(
      parse({
        "text/html": '<p class="MsoNormal"><b>rich</b></p>',
        "text/markdown": "# heading",
        "text/plain": "literal <b>text</b>\r\n\tline",
      }),
    ).toEqual({
      mimeType: "text/plain",
      blocks: [
        createParagraph([createText("literal <b>text</b>")]),
        createParagraph([createText("\tline")]),
      ],
    });
  });

  it.each([undefined, ""])("does not synthesize missing plain text (%s)", (plain) => {
    expect(
      parse({
        "text/html": '<p style="mso-list:l0 level1">rich</p>',
        "text/markdown": "# heading",
        ...(plain === undefined ? {} : { "text/plain": plain }),
      }),
    ).toBeUndefined();
  });

  it("keeps ordinary HTML and Markdown priority", () => {
    expect(parse({ "text/html": "<b>rich</b>", "text/plain": "plain" })?.mimeType).toBe(
      "text/html",
    );
    expect(
      parse({ "text/html": "<b>rich</b>", "text/markdown": "# heading" })?.mimeType,
    ).toBe("text/markdown");
  });

  it("still applies the consumer filter to plain text candidates", () => {
    const accept = vi.fn((fragment: ClipboardFragment) => fragment.blocks.length === 0);
    expect(
      parseClipboardData(
        {
          types: ["text/html", "text/plain"],
          getData: (type) =>
            type === "text/html" ? '<p class="MsoNormal">rich</p>' : "plain",
        },
        DEFAULT_CLIPBOARD_PARSERS,
        accept,
      ),
    ).toBeUndefined();
    expect(accept).toHaveBeenCalledTimes(1);
    expect(accept.mock.calls[0]?.[0].mimeType).toBe("text/plain");
  });
});

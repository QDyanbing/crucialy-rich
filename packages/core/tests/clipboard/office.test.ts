import { describe, expect, it, vi } from "vitest";
import {
  createParagraph,
  createText,
  DEFAULT_CLIPBOARD_PARSERS,
  parseClipboardData,
  parseHtml,
  parseMarkdown,
  type ClipboardFragment,
} from "../../src";

function parse(formats: Record<string, string>) {
  return parseClipboardData(
    { types: Object.keys(formats), getData: (type) => formats[type] ?? "" },
    DEFAULT_CLIPBOARD_PARSERS,
  );
}

describe("Office clipboard plain text fallback", () => {
  it.each([
    '<p class="other MsoNormal">Word</p>',
    '<div><p CLASS="msolistparagraph">Word</p></div>',
    '<span style="color:#000; MSO-bidi-font-weight:bold">Word</span>',
    '<html xmlns:w="urn:schemas-microsoft-com:office:word"><body><p>Word</p></body></html>',
    '<html xmlns:x="urn:schemas-microsoft-com:office:excel"><body><table><tr><td>Excel</td></tr></table></body></html>',
    '<html><head><meta name="Generator" content="Microsoft Word 16"></head><body><p>Word</p></body></html>',
    '<meta name="generator" content="Microsoft Office Excel 16"><p>Excel</p>',
    '<meta name="generator" content="Microsoft PowerPoint 16"><p>Slides</p>',
    "<style>.item { mso-list:l0 level1; }</style><p>Word</p>",
  ])("rejects Office rich import for %s", (html) => {
    expect(parseHtml(html)).toBeUndefined();
    expect(parseMarkdown(html)).toBeUndefined();
    expect(parse({ "text/html": html, "text/plain": "plain" })?.mimeType).toBe(
      "text/plain",
    );
  });

  it.each([
    "<p>mso-list: text about Microsoft Word</p>",
    '<!-- <p class="MsoNormal">comment</p> --><p>ordinary</p>',
    '<script>const text = "mso-list:l0";</script><p>ordinary</p>',
    '<p title="mso-list:l0" data-office="MsoNormal">ordinary</p>',
    '<p class="almostMsoNormal" style="color:#abc">ordinary</p>',
    '<meta name="generator" content="Microsoft unrelated"><p>ordinary</p>',
    '<p xmlns:example="urn:example:office">ordinary</p>',
  ])("does not classify plain content or unrelated metadata as Office: %s", (html) => {
    expect(parseHtml(html)?.mimeType).toBe("text/html");
    expect(parse({ "text/html": html, "text/plain": "plain" })?.mimeType).toBe(
      "text/html",
    );
  });

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

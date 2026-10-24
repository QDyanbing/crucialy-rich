import { describe, expect, it } from "vitest";
import {
  createCodeBlock,
  createDocument,
  createParagraph,
  createText,
  type TextMarks,
  type TextNode,
} from "../../src";
import { getClipboardHtml } from "../../src/clipboard/export-html";

const selection = {
  anchor: { path: [0, 0], offset: 0 },
  focus: { path: [0, 0], offset: 1 },
};

describe("clipboard HTML safety", () => {
  it("escapes text and link attribute values without copying editor attributes", () => {
    const node = createText('<img onerror="x">&', {
      link: {
        href: 'https://example.com/?q="&x=<a>',
        target: "_blank",
        rel: "nofollow",
      },
    });
    const html = getClipboardHtml(createDocument([createParagraph([node])]), {
      anchor: selection.anchor,
      focus: { path: [0, 0], offset: node.text.length },
    })!;
    expect(html).toContain("&lt;img onerror=&quot;x&quot;&gt;&amp;");
    expect(html).toContain('href="https://example.com/');
    expect(html).not.toMatch(/<img|data-|contenteditable|aria-|onclick/i);
  });

  it.each(["javascript:alert(1)", "data:text/html,x"])(
    "drops unsafe link protocol %s",
    (href) => {
      const node: TextNode = { type: "text", text: "甲", marks: { link: { href } } };
      expect(
        getClipboardHtml(createDocument([createParagraph([node])]), selection),
      ).toBe("<p><span>甲</span></p>");
    },
  );

  it("normalizes color and rejects injected CSS from a host model", () => {
    const node: TextNode = {
      type: "text",
      text: "甲",
      marks: {
        textColor: "#ABC",
        backgroundColor: "red; background: url(x)",
        fontSize: 999,
      } as TextMarks,
    };
    const html = getClipboardHtml(
      createDocument([createParagraph([node])]),
      selection,
    )!;
    expect(html).toBe('<p><span style="color: #aabbcc;">甲</span></p>');
  });

  it("keeps inline code semantics when combined with a link", () => {
    const node = createText("甲", {
      code: true,
      bold: true,
      link: { href: "https://example.com" },
    });
    const html = getClipboardHtml(
      createDocument([createParagraph([node])]),
      selection,
    )!;
    expect(html).toContain("<code>甲</code>");
    expect(html).toContain("font-weight: 700;");
    expect(html).not.toContain("data-");
  });

  it("does not turn a link's default decoration into an explicit underline mark", () => {
    const document = createDocument([
      createParagraph([
        createText("甲", {
          link: { href: "https://example.com" },
        }),
      ]),
    ]);
    expect(getClipboardHtml(document, selection)).toBe(
      '<p><a href="https://example.com/">甲</a></p>',
    );
  });

  it("keeps code block text literal and strips marks", () => {
    const document = createDocument([
      createCodeBlock([createText("<b>\n\t", { bold: true })]),
    ]);
    expect(
      getClipboardHtml(document, {
        anchor: selection.anchor,
        focus: { path: [0, 0], offset: 5 },
      }),
    ).toBe("<pre><code>&lt;b&gt;\n\t</code></pre>");
  });
});
